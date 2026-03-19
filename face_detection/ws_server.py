from __future__ import annotations

import asyncio
import json
import os
import time
from dataclasses import dataclass
from typing import Set

import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from face_id.core import FaceEngine, load_known_db


@dataclass
class Settings:
    # default: webcam. You can set FACE_SOURCE to RTSP path if desired.
    source: str = os.environ.get("FACE_SOURCE", "0")
    threshold: float = float(os.environ.get("FACE_THRESHOLD", "0.45"))
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
    print(f"[face_detection] running. source={settings.source} threshold={settings.threshold} target={settings.target_label!r}")

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

            for d in dets:
                emb = engine.embedding(frame, d)
                name, score = engine.identify(emb, known_embs, known_labels, threshold=settings.threshold)
                if score > best_score:
                    best_score = score
                    best_name = name

            if best_name and best_name != "Unknown":
                if settings.target_label and best_name.upper() != settings.target_label.upper():
                    await asyncio.sleep(0)
                else:
                    now = time.time()
                    prev = last_emit.get(best_name, 0.0)
                    if now - prev >= settings.cooldown_s:
                        last_emit[best_name] = now
                        await hub.broadcast_json(
                            {
                                "type": "face_detected",
                                "name": best_name,
                                "score": round(float(best_score), 4),
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

