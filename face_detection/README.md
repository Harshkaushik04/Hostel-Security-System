# Face Detection + “Who is that?” (YASH) module

This folder is a **standalone face recognition module** you can integrate later into your Hostel Security System.

It supports:
- **Enroll** yourself once (label: **YASH**)
- **Run** live camera/video stream recognition
- Outputs **name on the frame** (YASH / Unknown)

## What you need (data)

- A webcam OR a video stream URL
  - Webcam: device `0` (default)
  - RTSP example: `rtsp://...`
- 10–30 clear face frames of **you** (the enroll script will capture them)

This creates:
- `data/known_faces.npz` (your stored embedding + label)
- `models/` (downloaded ONNX models for detection + recognition)

## Setup (Windows)

Create venv + install deps:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Download models:

```bash
python -m face_id.download_models
```

## Step 1: Enroll yourself as “YASH”

This captures face samples from your webcam and stores your identity.

```bash
python -m face_id.enroll --name YASH --source 0 --samples 20
```

Controls:
- `q`: quit early

## Step 2: Run live recognition

Webcam:

```bash
python -m face_id.recognize_stream --source 0
```

RTSP/video URL:

```bash
python -m face_id.recognize_stream --source "rtsp://YOUR_CAMERA_URL"
```

Expected result: the overlay label should show **YASH** when your face is visible.

## Later integration with your main project

Your frontend already consumes face detections via **SSE** at:
- `GET /face-events/stream`

When you’re ready, we’ll add a small “bridge” that:
- reads the same camera feed your SFU/Media server is producing, and
- **pushes events** to your Node backend in the same shape the UI expects.

