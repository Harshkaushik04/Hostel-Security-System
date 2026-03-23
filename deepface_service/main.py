"""
Real-time face recognition with DeepFace + FastAPI WebSocket.
Direct Python API (in-process) — lower latency than the separate REST API.

Run (from this folder):
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8001
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import queue
import threading
import time
from typing import Any, Optional, Set

# OpenCV + RTSP on Windows: use TCP and reduce buffer delay (must be set before VideoCapture)
os.environ.setdefault(
    "OPENCV_FFMPEG_CAPTURE_OPTIONS",
    "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000",
)

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# --- Config (env) ---
FACE_SOURCE = os.getenv("FACE_SOURCE", "rtsp://127.0.0.1:8554/camera1")
FACE_DB_PATH = os.path.abspath(os.getenv("FACE_DB_PATH", os.path.join(os.path.dirname(__file__), "registered_faces")))
FACE_CAMERA_ID = os.getenv("FACE_CAMERA_ID", "camera1")
DEEPFACE_MODEL = os.getenv("DEEPFACE_MODEL", "ArcFace")
DETECTOR_BACKEND = os.getenv("DETECTOR_BACKEND", "retinaface")
# Min seconds between DeepFace.find() calls (heavy)
PROCESS_INTERVAL_SEC = float(os.getenv("PROCESS_INTERVAL_SEC", "0.6"))
# Same identity must hold this long before a face_detected event
FACE_STABLE_SECONDS = float(os.getenv("FACE_STABLE_SECONDS", "2.0"))
# JPEG quality for preview frames
JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "72"))
# Preview max width (smaller = faster encode + smaller WS payload)
PREVIEW_MAX_WIDTH = int(os.getenv("PREVIEW_MAX_WIDTH", "640"))

app = FastAPI(title="DeepFace recognition WebSocket")
clients: Set[WebSocket] = set()
loop_ref: Optional[asyncio.AbstractEventLoop] = None
stop_event = threading.Event()

# Lazy import so `uvicorn main:app` can load even if user only checks syntax
_deepface: Any = None


def get_deepface():
    global _deepface
    if _deepface is None:
        from deepface import DeepFace as DF

        _deepface = DF
    return _deepface


def identity_path_to_name(identity_path: str) -> str:
    """DeepFace returns filesystem paths; folder name = person label."""
    try:
        parent = os.path.dirname(str(identity_path).replace("\\", "/"))
        return os.path.basename(parent.rstrip("/")) or "Unknown"
    except Exception:
        return "Unknown"


def has_db_images() -> bool:
    if not os.path.isdir(FACE_DB_PATH):
        logger.error("FACE_DB_PATH is not a directory: %s", FACE_DB_PATH)
        return False
    for _root, _dirs, files in os.walk(FACE_DB_PATH):
        for f in files:
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp")):
                return True
    logger.warning(
        "No images under %s — recognition disabled until you add folders per person (see registered_faces/README.md)",
        FACE_DB_PATH,
    )
    return False


async def broadcast(payload: dict) -> None:
    if not clients:
        logger.debug("broadcast skipped: no WebSocket clients connected yet")
        return
    msg = json.dumps(payload)
    disconnected: Set[WebSocket] = set()
    for ws in clients:
        try:
            await ws.send_text(msg)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        clients.discard(ws)


def encode_preview_jpeg(frame_bgr: np.ndarray) -> str:
    h, w = frame_bgr.shape[:2]
    if w > PREVIEW_MAX_WIDTH and PREVIEW_MAX_WIDTH > 0:
        scale = PREVIEW_MAX_WIDTH / float(w)
        frame_bgr = cv2.resize(
            frame_bgr,
            (int(w * scale), int(h * scale)),
            interpolation=cv2.INTER_AREA,
        )
    ok, buf = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
    if not ok:
        return ""
    return base64.b64encode(buf.tobytes()).decode("ascii")


def detection_worker() -> None:
    global loop_ref

    logger.info("FACE_SOURCE=%s", FACE_SOURCE)
    logger.info("FACE_DB_PATH=%s", FACE_DB_PATH)

    db_ok = has_db_images()

    cap = cv2.VideoCapture(FACE_SOURCE, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        logger.warning("CAP_FFMPEG failed, retrying default backend for %s", FACE_SOURCE)
        cap = cv2.VideoCapture(FACE_SOURCE)
    try:
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    except Exception:
        pass
    if not cap.isOpened():
        logger.error("Could not open stream: %s", FACE_SOURCE)
        return

    # Latest-frame queue: RTSP servers often drop the client if we stop reading while DeepFace.find()
    # runs for seconds on the CPU. A dedicated reader thread keeps the stream fed continuously.
    frame_queue: queue.Queue = queue.Queue(maxsize=1)

    def reader_loop() -> None:
        consecutive_fail = 0
        while not stop_event.is_set():
            ok, frame = cap.read()
            if not ok or frame is None or frame.size == 0:
                consecutive_fail += 1
                if consecutive_fail == 1 or consecutive_fail % 200 == 0:
                    logger.warning(
                        "RTSP read failed (%s consecutive times) — check FFmpeg / MediaMTX",
                        consecutive_fail,
                    )
                time.sleep(0.05)
                continue
            consecutive_fail = 0
            try:
                frame_queue.put_nowait(frame)
            except queue.Full:
                try:
                    frame_queue.get_nowait()
                except queue.Empty:
                    pass
                try:
                    frame_queue.put_nowait(frame)
                except queue.Full:
                    pass

    reader_thread = threading.Thread(target=reader_loop, name="rtsp-reader", daemon=True)
    reader_thread.start()

    try:
        frame0 = frame_queue.get(timeout=30.0)
    except queue.Empty:
        logger.error(
            "Timed out waiting for first RTSP frame from %s. Check FFmpeg → MediaMTX and FACE_SOURCE.",
            FACE_SOURCE,
        )
        stop_event.set()
        reader_thread.join(timeout=3.0)
        cap.release()
        return

    logger.info("RTSP OK — first frame shape %s", frame0.shape)

    # Import DeepFace only after RTSP works — avoids long TF import blocking RTSP diagnostics
    logger.info("Loading DeepFace (first time may download models; this can take several minutes)…")
    DeepFace = get_deepface()
    logger.info("DeepFace ready.")

    last_process = 0.0
    streak_name: Optional[str] = None
    streak_start: Optional[float] = None
    blocked_emit_for: Optional[str] = None

    while not stop_event.is_set():
        try:
            frame = frame_queue.get(timeout=2.0)
        except queue.Empty:
            continue

        now = time.time()
        if (now - last_process) < PROCESS_INTERVAL_SEC:
            continue
        last_process = now

        ts_ms = int(now * 1000)

        # Send preview immediately so the UI gets frames even if DeepFace blocks (first model load)
        preview_fast = encode_preview_jpeg(frame)
        if loop_ref is not None and preview_fast:
            asyncio.run_coroutine_threadsafe(
                broadcast(
                    {
                        "type": "detection_update",
                        "cameraId": FACE_CAMERA_ID,
                        "ts": ts_ms,
                        "bboxes": [],
                        "frame_jpeg_base64": preview_fast,
                        "preview_only": True,
                    }
                ),
                loop_ref,
            )

        bboxes: list[dict[str, int]] = []
        best_name: Optional[str] = None
        best_distance: Optional[float] = None

        try:
            faces = DeepFace.extract_faces(
                img_path=frame,
                detector_backend=DETECTOR_BACKEND,
                enforce_detection=True,
                align=True,
            )
        except Exception as exc:
            logger.debug("extract_faces: %s", exc)
            faces = []

        vis = frame.copy()
        for f in faces:
            if not isinstance(f, dict):
                continue
            area = f.get("facial_area") or {}
            try:
                x, y, w, h = int(area["x"]), int(area["y"]), int(area["w"]), int(area["h"])
            except (KeyError, TypeError, ValueError):
                continue
            bboxes.append({"x": x, "y": y, "w": w, "h": h})
            cv2.rectangle(vis, (x, y), (x + w, y + h), (0, 200, 120), 2)

        # Recognize using the first face only (fastest)
        if db_ok and faces and isinstance(faces[0], dict) and "face" in faces[0]:
            face_img = faces[0]["face"]
            try:
                dfs = DeepFace.find(
                    img_path=face_img,
                    db_path=FACE_DB_PATH,
                    model_name=DEEPFACE_MODEL,
                    detector_backend="skip",
                    enforce_detection=False,
                )
                if dfs is not None and len(dfs) > 0:
                    df = dfs[0]
                    if hasattr(df, "empty") and not df.empty:
                        MAX_ACCEPT_DISTANCE = 0.2
                        id_col = "identity" if "identity" in df.columns else "Identity"
                        dist_col = "distance" if "distance" in df.columns else "Distance"

                        best_match = None
                        best_dist = 1.0

                        for _, r in df.iterrows():
                            d = float(r.get(dist_col, 1.0))
                            if d < best_dist:
                                best_dist = d
                                best_match = r

                        identity = str(best_match.get(id_col, "") or "")
                        dist = best_dist
                        if dist <= MAX_ACCEPT_DISTANCE:  # Adjust threshold as needed
                            name = identity_path_to_name(identity)
                        else:
                            name = "Unknown"
                        if name and name != "Unknown":
                            best_name = name
                            best_distance = dist
                            # Label on preview
                            if bboxes:
                                bx, by = bboxes[0]["x"], bboxes[0]["y"]
                                label = f"{name} ({dist:.3f})"
                                cv2.putText(
                                    vis,
                                    label,
                                    (bx, max(0, by - 8)),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.5,
                                    (0, 255, 0),
                                    1,
                                    cv2.LINE_AA,
                                )
            except Exception as exc:
                logger.debug("DeepFace.find: %s", exc)

        preview_b64 = encode_preview_jpeg(vis)

        if loop_ref is not None:
            asyncio.run_coroutine_threadsafe(
                broadcast(
                    {
                        "type": "detection_update",
                        "cameraId": FACE_CAMERA_ID,
                        "ts": ts_ms,
                        "bboxes": bboxes,
                        "frame_jpeg_base64": preview_b64 or preview_fast,
                        "preview_only": False,
                    }
                ),
                loop_ref,
            )

        # Stability-based notification (same as old LBPH server)
        if not best_name:
            streak_name = None
            streak_start = None
            blocked_emit_for = None
        else:
            if blocked_emit_for is not None and best_name != blocked_emit_for:
                blocked_emit_for = None

            if blocked_emit_for == best_name:
                pass
            elif streak_name != best_name:
                streak_name = best_name
                streak_start = now
            elif streak_start is not None and (now - streak_start) >= FACE_STABLE_SECONDS:
                if loop_ref is not None:
                    score = max(0.0, min(1.0, 1.0 / (1.0 + float(best_distance or 1.0))))
                    display_name = (best_name or "").strip() or "Unknown"
                    asyncio.run_coroutine_threadsafe(
                        broadcast(
                            {
                                "type": "face_detected",
                                "name": best_name,
                                "score": score,
                                "ts": ts_ms,
                                "message": f"{display_name}'s face detected",
                            }
                        ),
                        loop_ref,
                    )
                blocked_emit_for = best_name
                streak_name = None
                streak_start = None

    reader_thread.join(timeout=3.0)
    cap.release()
    logger.info("Detection worker stopped")


@app.on_event("startup")
async def on_startup() -> None:
    global loop_ref
    loop_ref = asyncio.get_running_loop()
    stop_event.clear()
    thread = threading.Thread(target=detection_worker, daemon=True)
    thread.start()
    app.state.worker_thread = thread
    logger.info("DeepFace WebSocket server started on :8001")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    stop_event.set()
    logger.info("Shutting down")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "deepface_service"}


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        clients.discard(websocket)
    except Exception:
        clients.discard(websocket)
