"""
Real-time face recognition with face_recognition library + FastAPI WebSocket.
Uses pre-computed face encodings stored as .npy files.

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
from typing import Optional, Set

# OpenCV + RTSP on Windows: use TCP and reduce buffer delay (must be set before VideoCapture)
os.environ.setdefault(
    "OPENCV_FFMPEG_CAPTURE_OPTIONS",
    "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000",
)

import cv2
import numpy as np
import face_recognition
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# --- Config (env) ---
FACE_SOURCE = os.getenv("FACE_SOURCE", "rtsp://127.0.0.1:8554/camera1")
FACE_DB_PATH = os.path.abspath(os.getenv("FACE_DB_PATH", os.path.join(os.path.dirname(__file__), "registered_faces")))
FACE_CAMERA_ID = os.getenv("FACE_CAMERA_ID", "camera1")
# Min seconds between face recognition calls (heavy)
PROCESS_INTERVAL_SEC = float(os.getenv("PROCESS_INTERVAL_SEC", "0.6"))
# Same identity must hold this long before a face_detected event
FACE_STABLE_SECONDS = float(os.getenv("FACE_STABLE_SECONDS", "2.0"))
# JPEG quality for preview frames
JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "72"))
# Preview max width (smaller = faster encode + smaller WS payload)
PREVIEW_MAX_WIDTH = int(os.getenv("PREVIEW_MAX_WIDTH", "640"))
# Face recognition tolerance (lower = stricter matching)
FACE_TOLERANCE = float(os.getenv("FACE_TOLERANCE", "0.6"))

app = FastAPI(title="Face Recognition WebSocket")
clients: Set[WebSocket] = set()
loop_ref: Optional[asyncio.AbstractEventLoop] = None
stop_event = threading.Event()

# Pre-loaded encodings
known_encodings: list = []
known_names: list = []


def load_encodings() -> bool:
    """Load pre-computed face encodings from the FACE_DB_PATH."""
    global known_encodings, known_names
    known_encodings = []
    known_names = []
    
    if not os.path.isdir(FACE_DB_PATH):
        logger.error("FACE_DB_PATH is not a directory: %s", FACE_DB_PATH)
        return False
    
    # Scan for .npy encoding files
    for root, dirs, files in os.walk(FACE_DB_PATH):
        for file in files:
            if file.endswith("_encoding.npy"):
                # Extract name from file (e.g., "harsh_encoding.npy" -> "harsh")
                name = file.split("_encoding.npy")[0]
                filepath = os.path.join(root, file)
                try:
                    encoding = np.load(filepath)
                    known_encodings.append(encoding)
                    known_names.append(name)
                    logger.info("Loaded encoding for: %s from %s", name, filepath)
                except Exception as e:
                    logger.warning("Failed to load encoding from %s: %s", filepath, e)
    
    if not known_encodings:
        logger.warning(
            "No encodings found under %s — recognition disabled. "
            "Please place {name}_encoding.npy files in registered_faces/",
            FACE_DB_PATH,
        )
        return False
    
    logger.info("Loaded %d face encodings", len(known_encodings))
    return True


def has_db_encodings() -> bool:
    """Check if encodings are loaded."""
    return len(known_encodings) > 0


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
    logger.info("FACE_TOLERANCE=%s", FACE_TOLERANCE)

    # Load face encodings once at startup
    logger.info("Loading face encodings...")
    db_ok = load_encodings()

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

    # Latest-frame queue: using a dedicated reader thread keeps the stream fed continuously
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
    logger.info("Face recognition ready using face_recognition library")

    last_process = 0.0
    streak_name: Optional[str] = None
    streak_start: Optional[float] = None
    blocked_emit_for: Optional[str] = None

    while not stop_event.is_set():
        best_name = None
        best_distance = None
        try:
            frame = frame_queue.get(timeout=2.0)
        except queue.Empty:
            continue

        now = time.time()
        if (now - last_process) < PROCESS_INTERVAL_SEC:
            continue
        last_process = now

        ts_ms = int(now * 1000)

        # Send preview immediately so the UI gets frames
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
            # Convert BGR to RGB for face_recognition
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect faces using face_recognition (uses dlib's CNN model)
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
            
            logger.debug("Detected %d face(s)", len(face_locations))
        except Exception as exc:
            logger.debug("Face detection error: %s", exc)
            face_locations = []
            face_encodings = []

        vis = frame.copy()
        
        # Draw bounding boxes for all detected faces
        for (top, right, bottom, left) in face_locations:
            x, y = left, top
            w, h = right - left, bottom - top
            bboxes.append({"x": x, "y": y, "w": w, "h": h})
            cv2.rectangle(vis, (left, top), (right, bottom), (0, 200, 120), 2)

        # Recognize using the first face only (fastest)
        if db_ok and face_encodings and has_db_encodings():
            face_encoding = face_encodings[0]
            try:
                # Compare the first detected face against known encodings
                matches = face_recognition.compare_faces(
                    known_encodings, 
                    face_encoding, 
                    tolerance=FACE_TOLERANCE
                )
                face_distances = face_recognition.face_distance(
                    known_encodings,
                    face_encoding
                )
                
                if len(face_distances) > 0:
                    # Find the best match
                    best_match_index = np.argmin(face_distances)
                    best_distance = float(face_distances[best_match_index])
                    
                    # Accept match if it's within tolerance
                    if matches[best_match_index]:
                        best_name = known_names[best_match_index].upper()
                    else:
                        best_name = "Unknown"
                else:
                    best_name = "Unknown"
                
                # Label on preview
                if bboxes:
                    x, y = bboxes[0]["x"], bboxes[0]["y"]
                    label = f"{best_name} ({best_distance:.3f})"
                    cv2.putText(
                        vis,
                        label,
                        (x, max(0, y - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        1,
                        cv2.LINE_AA,
                    )
                    logger.debug("Best match: %s (distance: %.3f)", best_name, best_distance)
            except Exception as exc:
                logger.debug("Face recognition error: %s", exc)

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

        # Stability-based notification
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
                    logger.info("Face detected: %s (score: %.3f)", display_name, score)
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
    logger.info("Face Recognition WebSocket server started on :8001")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    stop_event.set()
    logger.info("Shutting down")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "face_recognition_service"}


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

