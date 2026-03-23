# Face Recognition Real-time Service

Uses **face_recognition library** (with dlib) for face detection and encoding comparison. This model uses **pre-computed face encodings** stored as `.npy` files for faster inference than on-the-fly encoding.

## What you need to do

### 1. Python 3.10+ (recommended)

Use a **virtual environment**.

```powershell
cd deepface_service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

First install may take several minutes as dlib is compiled for your system.

### 2. Generate face encodings

Use the **`face_recognition3/take.py`** script to capture and encode faces for each person.

```powershell
cd ..\face_recognition3
python take.py
# Enter name when prompted: "harsh"
# Press 'c' to capture a frame
# Press 'q' to quit
# This creates: faces/harsh.jpg and faces/harsh_encoding.npy
```

Copy the generated `.npy` encoding files to `../deepface_service/registered_faces/`:

```
deepface_service/
  registered_faces/
    harsh_encoding.npy
    yash_encoding.npy
    ...
```

**Important**: The service loads `.npy` files using the filename pattern `{name}_encoding.npy`.

### 3. Point at your camera stream

Set `FACE_SOURCE` to your RTSP URL.

```powershell
$env:FACE_SOURCE = "rtsp://127.0.0.1:8554/camera1"
```

Optional env vars:

| Variable | Default | Meaning |
|----------|---------|---------|
| `FACE_SOURCE` | `rtsp://127.0.0.1:8554/camera1` | OpenCV video source |
| `FACE_DB_PATH` | `./registered_faces` | Absolute or relative path to `.npy` encodings |
| `FACE_CAMERA_ID` | `camera1` | Shown in the Live Feed detection list |
| `FACE_TOLERANCE` | `0.6` | Face recognition tolerance (lower = stricter) |
| `PROCESS_INTERVAL_SEC` | `0.6` | Min seconds between recognition attempts |
| `FACE_STABLE_SECONDS` | `2.0` | How long the same ID must hold before "X's face detected" |
| `PREVIEW_MAX_WIDTH` | `640` | Resize preview JPEG for the browser |

### How often things update (timing)

- **`PROCESS_INTERVAL_SEC` (default `0.6`)** — Minimum time between detection passes.
- **`FACE_STABLE_SECONDS` (default `2.0`)** — How long the same person must be recognized before the green **"<name>'s face detected"** banner fires.
- **First run** — Model loads quickly since encodings are pre-computed.

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

- **WS Offline / "start face_recognition_service"**:
  - Confirm `uvicorn` is running: `uvicorn main:app --host 0.0.0.0 --port 8001`
  - **Windows**: Use `127.0.0.1` instead of `localhost` to avoid IPv6 issues
  - Override URL: in `frontend/` create `.env` with `VITE_DEEPFACE_WS_URL=ws://127.0.0.1:8001/ws`
- **Firewall / wrong host**: The browser must reach port **8001** on the machine running `uvicorn`.
- **No recognition**: Generate encodings using `face_recognition3/take.py` and copy `.npy` files to `registered_faces/`
- **Poor accuracy**: Try lowering `FACE_TOLERANCE` (e.g., 0.4 for stricter matching)
- **Slow CPU**: Increase `PROCESS_INTERVAL_SEC` or lower `PREVIEW_MAX_WIDTH`

## API

- `GET /health` — liveness
- `WebSocket /ws` — JSON messages:
  - `detection_update`: preview + `bboxes`
  - `face_detected`: stable identity notification
