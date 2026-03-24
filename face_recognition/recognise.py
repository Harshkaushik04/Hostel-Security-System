import cv2
import face_recognition
import numpy as np
import os
import asyncio
import json
import base64
import time
import threading
import queue
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Configuration
FACE_SOURCE = os.getenv("FACE_SOURCE", "rtsp://127.0.0.1:8554/camera1")
FACE_CAMERA_ID = os.getenv("FACE_CAMERA_ID", "camera1")
PROCESS_INTERVAL_SEC = float(os.getenv("PROCESS_INTERVAL_SEC", "0.6"))
FACE_STABLE_SECONDS = float(os.getenv("FACE_STABLE_SECONDS", "2.0"))
PREVIEW_MAX_WIDTH = 640
JPEG_QUALITY = 72

app = FastAPI(title="Face Recognition WebSocket")
clients = set()
loop_ref = None
stop_event = threading.Event()

def load_encodings(encodings_path):
    encodings = []
    class_names = []
    if not os.path.exists(encodings_path):
        logger.warning(f"Faces directory '{encodings_path}' not found. Create it and use take.py to add faces.")
        return encodings, class_names

    for file in os.listdir(encodings_path):
        if file.endswith("_encoding.npy"):
            class_name = file.split('_')[0]
            encoding = np.load(os.path.join(encodings_path, file))
            encodings.append(encoding)
            class_names.append(class_name)
    return encodings, class_names

encodings_path = 'faces'
known_encodings, class_names = load_encodings(encodings_path)

def encode_preview_jpeg(frame_bgr):
    h, w = frame_bgr.shape[:2]
    if w > PREVIEW_MAX_WIDTH and PREVIEW_MAX_WIDTH > 0:
        scale = PREVIEW_MAX_WIDTH / float(w)
        frame_bgr = cv2.resize(frame_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    
    ok, buf = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
    if not ok:
        return ""
    return base64.b64encode(buf.tobytes()).decode("ascii")

async def broadcast(payload: dict):
    if not clients:
        return
    msg = json.dumps(payload)
    disconnected = set()
    for ws in clients:
        try:
            await ws.send_text(msg)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        clients.discard(ws)

def detection_worker():
    global loop_ref
    logger.info("Connecting to source: %s", FACE_SOURCE)
    
    # Use TCP for RTSP to prevent UDP packet drops
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"
    cap = cv2.VideoCapture(FACE_SOURCE)
    
    if not cap.isOpened():
        # Fallback to webcam if RTSP fails
        logger.warning("Stream failed, falling back to webcam 0")
        cap = cv2.VideoCapture(0)

    # Frame queue to keep stream buffer empty
    frame_queue = queue.Queue(maxsize=1)

    def reader_loop():
        while not stop_event.is_set():
            ok, frame = cap.read()
            if not ok:
                time.sleep(0.05)
                continue
            try:
                frame_queue.put_nowait(frame)
            except queue.Full:
                try:
                    frame_queue.get_nowait()
                    frame_queue.put_nowait(frame)
                except queue.Empty:
                    pass

    reader_thread = threading.Thread(target=reader_loop, daemon=True)
    reader_thread.start()

    last_process = 0.0
    streak_name = None
    streak_start = None
    blocked_emit_for = None

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
        
        # Fast preview send before heavy processing
        preview_fast = encode_preview_jpeg(frame)
        if loop_ref:
            asyncio.run_coroutine_threadsafe(
                broadcast({
                    "type": "detection_update",
                    "cameraId": FACE_CAMERA_ID,
                    "ts": ts_ms,
                    "bboxes": [],
                    "frame_jpeg_base64": preview_fast,
                    "preview_only": True,
                }), loop_ref
            )

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process detection
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        vis = frame.copy()
        bboxes = []
        best_name = None
        best_distance = 1.0

        for face_encoding, face_location in zip(face_encodings, face_locations):
            y1, x2, y2, x1 = face_location
            w = x2 - x1
            h = y2 - y1
            bboxes.append({"x": x1, "y": y1, "w": w, "h": h})
            
            name = "Unknown"
            dist = 1.0
            
            if known_encodings:
                distances = face_recognition.face_distance(known_encodings, face_encoding)
                best_match_index = np.argmin(distances)
                
                if distances[best_match_index] < 0.6:
                    name = class_names[best_match_index].upper()
                    dist = distances[best_match_index]
                    
                    if dist < best_distance:
                        best_distance = dist
                        best_name = name

            # Draw UI on the preview frame
            cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.rectangle(vis, (x1, y2 - 20), (x2, y2), (0, 255, 0), cv2.FILLED)
            label = f"{name}" if name == "Unknown" else f"{name} ({dist:.2f})"
            cv2.putText(vis, label, (x1 + 6, y2 - 6), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 255, 255), 1)

        preview_b64 = encode_preview_jpeg(vis)
        
        if loop_ref:
            asyncio.run_coroutine_threadsafe(
                broadcast({
                    "type": "detection_update",
                    "cameraId": FACE_CAMERA_ID,
                    "ts": ts_ms,
                    "bboxes": bboxes,
                    "frame_jpeg_base64": preview_b64,
                    "preview_only": False,
                }), loop_ref
            )

        # Notify if the same person stays in frame
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
                    score = max(0.0, 1.0 - best_distance)
                    asyncio.run_coroutine_threadsafe(
                        broadcast({
                            "type": "face_detected",
                            "name": best_name,
                            "score": score,
                            "ts": ts_ms,
                            "message": f"{best_name}'s face detected"
                        }), loop_ref
                    )
                blocked_emit_for = best_name
                streak_name = None
                streak_start = None

    cap.release()

@app.on_event("startup")
async def on_startup():
    global loop_ref
    loop_ref = asyncio.get_running_loop()
    stop_event.clear()
    threading.Thread(target=detection_worker, daemon=True).start()
    logger.info("Face Recognition WebSocket server started on :8001")

@app.on_event("shutdown")
async def on_shutdown():
    stop_event.set()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "face_recognition"}

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.discard(websocket)
    except Exception:
        clients.discard(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)