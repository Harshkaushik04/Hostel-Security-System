# DeepFace real-time service

Uses **DeepFace** directly in Python (same process as FastAPI). This is **faster and simpler** than running DeepFace’s separate HTTP API and POSTing every frame.

## What you need to do

### 1. Python 3.10+ (recommended)

Use a **virtual environment** (TensorFlow is heavy).

```powershell
cd deepface_service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

If you see **`ModuleNotFoundError: No module named 'tf_keras'`** or **`requires tf-keras package`**, install it (it is listed in `requirements.txt`; run `pip install -r requirements.txt` again after a git pull).

First install may take several minutes; DeepFace downloads model weights on **first recognition**.

### 2. Register people

Under `registered_faces/`, create **one folder per person** (folder name = label in the UI). Put **1–3 clear face photos** in each folder.

Example:

```
registered_faces/
  Alice/
    a1.jpg
  Bob/
    b1.jpg
```

See `registered_faces/README.md`.

### 3. Point at your camera stream

Set `FACE_SOURCE` to your RTSP URL (same idea as before: FFmpeg → MediaMTX, etc.).

```powershell
$env:FACE_SOURCE = "rtsp://127.0.0.1:8554/camera1"
```

Optional env vars:

| Variable | Default | Meaning |
|----------|---------|---------|
| `FACE_SOURCE` | `rtsp://127.0.0.1:8554/camera1` | OpenCV video source |
| `FACE_DB_PATH` | `./registered_faces` | Absolute or relative path to face DB |
| `FACE_CAMERA_ID` | `camera1` | Shown in the Live Feed detection list |
| `DEEPFACE_MODEL` | `Facenet` | DeepFace model name |
| `DETECTOR_BACKEND` | `opencv` | Faster than RetinaFace; try `ssd` if needed |
| `PROCESS_INTERVAL_SEC` | `0.6` | Min seconds between recognition attempts |
| `FACE_STABLE_SECONDS` | `2.0` | How long the same ID must hold before “X's face detected” |
| `PREVIEW_MAX_WIDTH` | `640` | Resize preview JPEG for the browser |

### How often things update (timing)

- **`PROCESS_INTERVAL_SEC` (default `0.6`)** — Minimum time between **full** detection passes (face boxes + `DeepFace.find`). The UI list gets **about one row per interval** when the stream is running (plus variance from CPU load).
- **`FACE_STABLE_SECONDS` (default `2.0`)** — How long the **same person** must be recognized in a row before the green **“&lt;name&gt;’s face detected”** banner fires (once per “sitting” until the face leaves or identity changes).
- **First run** — Building the embedding index for a large `registered_faces` folder and the **first** `find()` can take **tens of seconds**; later `find()` calls are much faster (see your terminal `find function duration`).

### 4. Run the server

```powershell
cd deepface_service
.\.venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8001
```

Keep this running while you use **Live Feed**. The frontend connects to `ws://<host>:8001/ws`.

### 5. Open the admin Live Feed

The **Detections** panel shows:

- Live preview (JPEG) + boxes from `detection_update`
- A green banner when a person is stable for `FACE_STABLE_SECONDS` (`face_detected`)

## Troubleshooting

- **WS Offline / “start deepface_service”**:
  - Confirm `uvicorn` is running: `uvicorn main:app --host 0.0.0.0 --port 8001`
  - **Windows**: Browsers often resolve `localhost` to **IPv6** (`::1`) while the server listens on **IPv4**. The Live Feed app now uses **`127.0.0.1`** for the WebSocket when you open the site as `localhost`; if you still use another LAN IP, open the UI with that same host.
  - If the frontend loads **before** `uvicorn` starts, wait **~3s** (auto-reconnect) or refresh the page.
  - Override URL: in `frontend/` create `.env` with `VITE_DEEPFACE_WS_URL=ws://127.0.0.1:8001/ws` and restart `npm run dev`.
- **Firewall / wrong host**: The browser must reach port **8001** on the machine running `uvicorn`.
- **Detections stop after a few seconds**: `DeepFace.find()` can take several seconds on CPU. If the **main** loop stopped reading RTSP during that time, many RTSP pipelines **drop the connection**. The service uses a **background reader thread** so frames are always consumed; restart `uvicorn` after updating.
- **No recognition**: Add images under `registered_faces/<Name>/`; restart the service.
- **Slow CPU**: Increase `PROCESS_INTERVAL_SEC`, lower `PREVIEW_MAX_WIDTH`, or use a GPU + TensorFlow GPU build.
- **Apple Silicon**: If TensorFlow fails to install, follow DeepFace docs for `tensorflow-macos` / Metal.

## API

- `GET /health` — liveness
- `WebSocket /ws` — JSON messages:
  - `detection_update`: preview + `bboxes`
  - `face_detected`: stable identity notification
