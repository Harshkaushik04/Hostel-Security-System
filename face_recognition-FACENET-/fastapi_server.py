import cv2
import torch
import pickle
import numpy as np
import time
import requests
import threading
import re
import json
import os
from fastapi import FastAPI
from facenet_pytorch import InceptionResnetV1, MTCNN
from pyzbar.pyzbar import decode
import uvicorn

app = FastAPI()

# --- 1. Global Initialization ---
print("Loading models...")
mtcnn = MTCNN(keep_all=True)
facenet = InceptionResnetV1(pretrained='vggface2').eval()
try:
    face_classifier = pickle.load(open("face_model.pkl", "rb"))
except FileNotFoundError:
    print("Warning: face_model.pkl not found.")
    face_classifier = None

# --- 2. Global State & Caches ---
active_streams = {}

# Caches format: {"cameraName_payload": timestamp_in_seconds}
face_cache = {}
qr_cache = {}
CACHE_TTL = 10.0  

NODE_BACKEND_URL = "http://127.0.0.1:3000"
MEDIAMTX_API_URL = "http://127.0.0.1:9997/v3/paths/list"

# --- 3. Helper Functions ---
def is_valid_camera(name: str) -> bool:
    """Strictly accepts 'camera1' through 'camera100'."""
    if not name:
        return False
    match = re.match(r'^camera(\d+)$', name)
    if match:
        num = int(match.group(1))
        return 1 <= num <= 100
    return False

def should_send_to_backend(cache_key: str, cache_dict: dict) -> bool:
    """Debounces requests so we don't spam the Node backend."""
    current_time = time.time()
    last_seen = cache_dict.get(cache_key, 0)
    
    if current_time - last_seen > CACHE_TTL:
        cache_dict[cache_key] = current_time
        return True
    return False

def send_face_to_node(name: str, camera_name: str):
    print(f"name:{name}")
    if name == "Unknown" or not name:
        return
    
    cache_key = f"{camera_name}_{name}"
    if should_send_to_backend(cache_key, face_cache):
        try:
            payload = {"name": name, "cameraName": camera_name}
            print(f"[NODE] Sent Face: {name} from {camera_name}")
            requests.post(f"{NODE_BACKEND_URL}/api/face", json=payload, timeout=2)
        except requests.RequestException as e:
            print(f"[NODE ERROR] Face payload failed: {e}")

def send_qr_to_node(payload_str: str, camera_name: str):
    if not payload_str:
        return
        
    cache_key = f"{camera_name}_{payload_str}"
    if should_send_to_backend(cache_key, qr_cache):
        try:
            # Try to parse the QR string as JSON so we can inject cameraName directly into the object
            try:
                data = json.loads(payload_str)
                if isinstance(data, dict):
                    data["cameraName"] = camera_name
                else:
                    data = {"qr_data": data, "cameraName": camera_name}
            except json.JSONDecodeError:
                # Fallback if the QR isn't valid JSON
                data = {"qr_data": payload_str, "cameraName": camera_name}
                
            requests.post(f"{NODE_BACKEND_URL}/api/qr", json=data, timeout=2)
            print(f"[NODE] Sent QR payload from {camera_name}")
        except requests.RequestException as e:
            print(f"[NODE ERROR] QR payload failed: {e}")

def start_stream_worker(stream_name: str):
    """Spawns the background thread if it isn't already running."""
    if active_streams.get(stream_name):
        return
    
    active_streams[stream_name] = True
    thread = threading.Thread(target=process_stream, args=(stream_name,), daemon=True)
    thread.start()

# --- 4. The Video Processing Worker ---
def process_stream(camera_name: str):
    rtsp_url = f"rtsp://localhost:8554/{camera_name}"
    print(f"[STREAM] Starting processing for {camera_name} at {rtsp_url}")
    
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
    cap = cv2.VideoCapture(rtsp_url)
    
    frame_count = 0
    process_interval = 5  # Process 1 out of every 5 frames

    while active_streams.get(camera_name, False):
        ret, frame = cap.read()
        if not ret:
            print(f"[STREAM] Disconnected {camera_name}. Retrying in 2s...")
            time.sleep(2)
            cap = cv2.VideoCapture(rtsp_url)
            continue
        
        frame_count += 1
        if frame_count % process_interval != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # -- A. QR Code Detection --
        decoded_objects = decode(frame)
        for obj in decoded_objects:
            qr_data = obj.data.decode('utf-8')
            send_qr_to_node(qr_data, camera_name)

        # -- B. Face Detection & Recognition --
        if face_classifier is not None:
            try:
                boxes, _ = mtcnn.detect(rgb)
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = map(int, box)
                        h, w, _ = rgb.shape

                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w, x2), min(h, y2)

                        face = rgb[y1:y2, x1:x2]
                        if face.size == 0:
                            continue

                        face = cv2.resize(face, (160, 160))
                        face_tensor = torch.tensor(face).permute(2, 0, 1).float() / 255.0
                        face_tensor = face_tensor.unsqueeze(0)

                        with torch.no_grad():
                            embedding = facenet(face_tensor).numpy()

                        probs = face_classifier.predict_proba(embedding)
                        max_prob = np.max(probs)

                        if max_prob < 0.5:
                            send_face_to_node("Unknown", camera_name)
                        else:
                            name = face_classifier.predict(embedding)[0]
                            send_face_to_node(name, camera_name)
                            
            except Exception as e:
                print(f"[AI ERROR] Frame processing failed on {camera_name}: {e}")

    cap.release()
    print(f"[STREAM] Stopped processing for {camera_name}")


# --- 5. Application Events & Webhooks ---
@app.on_event("startup")
def sync_active_cameras():
    """Fetches currently active streams from MediaMTX on startup."""
    print("[INIT] Syncing active cameras from MediaMTX...")
    try:
        response = requests.get(MEDIAMTX_API_URL, timeout=3)
        if response.status_code == 200:
            data = response.json()
            for item in data.get("items", []):
                cam_name = item.get("name")
                if is_valid_camera(cam_name):
                    start_stream_worker(cam_name)
    except Exception as e:
        print(f"[INIT ERROR] Could not reach MediaMTX at startup: {e}")


@app.get("/stream-started")
def stream_started(name: str):
    if not is_valid_camera(name):
        return {"status": "ignored", "message": f"Rejected: '{name}' is not in camera1-camera100 range."}
    
    start_stream_worker(name)
    return {"status": "success", "message": f"Started processing {name}"}


@app.get("/stream-stopped")
def stream_stopped(name: str):
    if not name:
        return {"status": "error", "message": "Stream name required"}
    
    active_streams[name] = False
    return {"status": "success", "message": f"Stopping processing for {name}"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6500)