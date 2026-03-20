from __future__ import annotations

import asyncio
import json
import os
import time
from dataclasses import dataclass
from typing import Set

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from face_id.core import FaceEngine, load_known_db


@dataclass
class Settings:
    # default: webcam. You can set FACE_SOURCE to RTSP path if desired.
    source: str = os.environ.get("FACE_SOURCE", "0")
    # Higher threshold reduces false positives.
    threshold: float = float(os.environ.get("FACE_THRESHOLD", "0.65"))
    # Require the best match to beat the 2nd best by this margin.
    margin: float = float(os.environ.get("FACE_MARGIN", "0.06"))
    # Require the same identity for N consecutive frames before emitting.
    min_consecutive: int = int(os.environ.get("FACE_MIN_CONSECUTIVE", "3"))
    # Only emit message for this label (set empty to emit all recognized)
    target_label: str = os.environ.get("FACE_TARGET_LABEL", "YASH")
    # cooldown per label (seconds) to avoid spamming UI
    cooldown_s: float = float(os.environ.get("FACE_COOLDOWN_S", "3"))


settings = Settings()

app = FastAPI(title="Face Detection WS", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Hub:
    def __init__(self) -> None:
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def add(self, ws: WebSocket) -> None:
        async with self.lock:
            self.clients.add(ws)

    async def remove(self, ws: WebSocket) -> None:
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast_json(self, payload: dict) -> None:
        msg = json.dumps(payload)
        async with self.lock:
            clients = list(self.clients)
        for ws in clients:
            try:
                await ws.send_text(msg)
            except Exception:
                # ignore broken connections; they'll be removed on disconnect
                pass


hub = Hub()
_task: asyncio.Task | None = None


def _open_capture(source: str) -> cv2.VideoCapture:
    if source.isdigit():
        return cv2.VideoCapture(int(source))
    return cv2.VideoCapture(source)

def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32).reshape(-1)
    b = b.astype(np.float32).reshape(-1)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
    return float(np.dot(a, b) / denom)

def _best_two_scores(emb: np.ndarray, known_embs: np.ndarray, known_labels: list[str]) -> tuple[str, float, float]:
    """
    Returns (best_label, best_score, second_best_score)
    """
    if known_embs.size == 0:
        return ("Unknown", 0.0, 0.0)

    best_i = -1
    best = -1.0
    second = -1.0

    for i in range(known_embs.shape[0]):
        s = _cosine_sim(emb, known_embs[i])
        if s > best:
            second = best
            best = s
            best_i = i
        elif s > second:
            second = s

    label = known_labels[best_i] if best_i >= 0 else "Unknown"
    return (label, float(best), float(max(second, 0.0)))


async def recognition_loop() -> None:
    engine = FaceEngine()
    known_embs, known_labels = load_known_db()
    if not known_labels:
        print('[face_detection] No enrolled faces found. Run: python -m face_id.enroll --name YASH --source 0 --samples 20')

    cap = _open_capture(settings.source)
    if not cap.isOpened():
        print(f"[face_detection] Could not open source: {settings.source}")
        return

    last_emit: dict[str, float] = {}
    consecutive: dict[str, int] = {}
    print(
        f"[face_detection] running. source={settings.source} threshold={settings.threshold} "
        f"margin={settings.margin} min_consecutive={settings.min_consecutive} target={settings.target_label!r}"
    )

    try:
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                await asyncio.sleep(0.1)
                continue

            dets = engine.detect(frame)
            dets = sorted(dets, key=lambda d: d.score, reverse=True)[:5]

            best_name = "Unknown"
            best_score = 0.0
            second_score = 0.0

            for d in dets:
                emb = engine.embedding(frame, d)
                name, score, second = _best_two_scores(emb, known_embs, known_labels)
                if score > best_score:
                    best_score = score
                    second_score = second
                    best_name = name

            # strict acceptance rules to reduce false positives
            accepted = (
                best_name != "Unknown"
                and best_score >= settings.threshold
                and (best_score - second_score) >= settings.margin
            )

            # If a target label is set, only accept that label.
            if settings.target_label:
                accepted = accepted and (best_name.upper() == settings.target_label.upper())

            if accepted:
                consecutive[best_name] = consecutive.get(best_name, 0) + 1
            else:
                # reset counters when not accepted
                consecutive.clear()

            if accepted and consecutive.get(best_name, 0) >= settings.min_consecutive:
                now = time.time()
                prev = last_emit.get(best_name, 0.0)
                if now - prev >= settings.cooldown_s:
                    last_emit[best_name] = now
                    consecutive.clear()
                    await hub.broadcast_json(
                        {
                            "type": "face_detected",
                            "name": best_name,
                            "score": round(float(best_score), 4),
                            "second": round(float(second_score), 4),
                            "ts": int(now * 1000),
                            "message": f"{best_name}'s face has been detected",
                        }
                    )

            await asyncio.sleep(0)  # yield
    finally:
        cap.release()


@app.on_event("startup")
async def _startup() -> None:
    global _task
    if _task is None:
        _task = asyncio.create_task(recognition_loop())


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    await hub.add(ws)
    try:
        # keepalive: client may send anything; we ignore
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.remove(ws)

