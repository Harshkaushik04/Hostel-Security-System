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
import queue
from fastapi import FastAPI
from facenet_pytorch import InceptionResnetV1, MTCNN
from pyzbar.pyzbar import decode
import uvicorn
from dotenv import load_dotenv

load_dotenv(".env")

app = FastAPI()
# Limit PyTorch to 2 or 4 threads so it doesn't overload the VM's CPU cores
# torch.set_num_threads(2)
# --- 1. Hardware & Models ---
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Loading models on {device}...")

mtcnn = MTCNN(keep_all=True, device=device)
facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

inference_lock = threading.Lock()

try:
    face_classifier = pickle.load(open("face_model.pkl", "rb"))
except FileNotFoundError:
    print("Warning: face_model.pkl not found.")
    face_classifier = None

# --- 2. Global State & Caches ---
# Replaced boolean dict with thread session objects
stream_sessions = {} # format: { "camera1": {"thread": Thread, "stop_event": Event} }

face_cache = {}
qr_cache = {}
CACHE_TTL = 10.0  

NODE_BACKEND_URL = f"http://{os.getenv('NODE_BACKEND_IP')}:3000"
MEDIAMTX_API_URL = F"http://{os.getenv('MEDIAMTX_IP')}:9997/v3/paths/list"

# --- 3. Helper Functions ---
def is_valid_camera(name: str) -> bool:
    if not name:
        return False
    match = re.match(r'^camera(\d+)$', name)
    if match:
        num = int(match.group(1))
        return 1 <= num <= 100
    return False

def should_send_to_backend(cache_key: str, cache_dict: dict) -> bool:
    current_time = time.time()
    last_seen = cache_dict.get(cache_key, 0)
    if current_time - last_seen > CACHE_TTL:
        cache_dict[cache_key] = current_time
        return True
    return False

def send_face_to_node(name: str, camera_name: str):
    if name == "Unknown" or not name:
        return
    print(f"[HELLO] Face visible: {name} from {camera_name}")
    cache_key = f"{camera_name}_{name}"
    if should_send_to_backend(cache_key, face_cache):
        try:
            payload = {"name": name, "cameraName": camera_name}
            requests.post(f"{NODE_BACKEND_URL}/face-data", json=payload, timeout=2)
            print(f"[NODE] Sent Face: {name} from {camera_name}")
        except requests.RequestException as e:
            print(f"[NODE ERROR] Face payload failed: {e}")

def send_qr_to_node(payload_str: str, camera_name: str):
    if not payload_str:
        return
    cache_key = f"{camera_name}_{payload_str}"
    if should_send_to_backend(cache_key, qr_cache):
        try:
            try:
                data = json.loads(payload_str)
                if isinstance(data, dict):
                    data["cameraName"] = camera_name
                else:
                    data = {"qr_data": data, "cameraName": camera_name}
            except json.JSONDecodeError:
                data = {"qr_data": payload_str, "cameraName": camera_name}
            
            requests.post(f"{NODE_BACKEND_URL}/qr-data", json=data, timeout=2)
            print(f"[NODE] Sent QR payload from {camera_name}")
        except requests.RequestException as e:
            print(f"[NODE ERROR] QR payload failed: {e}")


# --- 4. The Video Processing Worker ---
def process_stream(camera_name: str, stop_event: threading.Event):
    rtsp_url = f"rtsp://{os.getenv('MEDIAMTX_IP')}:8554/{camera_name}"
    print(f"[STREAM] Starting processing for {camera_name}")
    
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"
    frame_queue = queue.Queue(maxsize=1)
    
    def reader_thread():
        cap = cv2.VideoCapture(rtsp_url)
        
        while not stop_event.is_set():
            if not cap.isOpened():
                print(f"[STREAM] Reconnecting {camera_name}...")
                cap.release()
                
                # Sleep in small increments so we can break out immediately if stop_event is fired
                for _ in range(20):
                    if stop_event.is_set(): break
                    time.sleep(0.1)
                    
                if stop_event.is_set(): break
                cap = cv2.VideoCapture(rtsp_url)
                continue

            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue
            
            try:
                frame_queue.get_nowait()
            except queue.Empty:
                pass
            
            try:
                frame_queue.put_nowait(frame)
            except queue.Full:
                pass
                
        cap.release()
        print(f"[STREAM] OpenCV disconnected cleanly from {camera_name}")

    reader = threading.Thread(target=reader_thread, daemon=True)
    reader.start()

    process_interval = 0.5  
    last_process_time = 0

    while not stop_event.is_set():
        try:
            # Short timeout so the loop checks stop_event frequently
            frame = frame_queue.get(timeout=0.5)
        except queue.Empty:
            continue

        current_time = time.time()
        if current_time - last_process_time < process_interval:
            continue
        last_process_time = current_time

        h, w = frame.shape[:2]
        if w > 720:
            scale = 720.0 / w
            process_frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
        else:
            process_frame = frame.copy()

        gray = cv2.cvtColor(process_frame, cv2.COLOR_BGR2GRAY)
        decoded_objects = decode(gray)
        for obj in decoded_objects:
            qr_data = obj.data.decode('utf-8')
            send_qr_to_node(qr_data, camera_name)

        if face_classifier is not None:
            try:
                rgb = cv2.cvtColor(process_frame, cv2.COLOR_BGR2RGB)
                
                with inference_lock:
                    boxes, _ = mtcnn.detect(rgb)
                
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = map(int, box)
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(rgb.shape[1], x2), min(rgb.shape[0], y2)

                        face = rgb[y1:y2, x1:x2]
                        if face.size == 0 or face.shape[0] < 20 or face.shape[1] < 20:
                            continue

                        face_resized = cv2.resize(face, (160, 160))
                        face_tensor = torch.tensor(face_resized).permute(2, 0, 1).float() / 255.0
                        face_tensor = face_tensor.unsqueeze(0).to(device)

                        with inference_lock:
                            with torch.no_grad():
                                embedding = facenet(face_tensor).cpu().numpy()

                        probs = face_classifier.predict_proba(embedding)
                        max_prob = np.max(probs)

                        if max_prob < 0.7:
                            send_face_to_node("Unknown", camera_name)
                        else:
                            name = face_classifier.predict(embedding)[0]
                            send_face_to_node(name, camera_name)
                            
            except Exception as e:
                print(f"[AI ERROR] Frame processing failed on {camera_name}: {e}")

    # Ensure the reader thread dies cleanly before we exit
    reader.join(timeout=2.0)
    print(f"[STREAM] Worker thread exited cleanly for {camera_name}")


def start_stream_worker(stream_name: str):
    session = stream_sessions.get(stream_name)
    
    if session and session["thread"].is_alive():
        if not session["stop_event"].is_set():
            return # Already running healthily
        
        # If it is currently shutting down, explicitly wait for it to die
        # so we don't spawn a new OpenCV cap over the dying one.
        print(f"[SYSTEM] Waiting for old {stream_name} thread to terminate...")
        session["thread"].join(timeout=3.0)

    # Spawn new controlled session
    stop_event = threading.Event()
    thread = threading.Thread(target=process_stream, args=(stream_name, stop_event), daemon=True)
    stream_sessions[stream_name] = {"thread": thread, "stop_event": stop_event}
    thread.start()


# --- 5. Application Events & Webhooks ---
@app.on_event("startup")
def sync_active_cameras():
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
    
    session = stream_sessions.get(name)
    if session:
        session["stop_event"].set() # Fire the permanent kill signal
        
    return {"status": "success", "message": f"Stopping processing for {name}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6500)