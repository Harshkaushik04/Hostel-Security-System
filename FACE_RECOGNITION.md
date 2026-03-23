# Face recognition (DeepFace)

The old `face_recognition/` LBPH pipeline was removed. Use **`deepface_service/`** instead.

**Quick start:** open [`deepface_service/README.md`](deepface_service/README.md).

Summary:

1. `cd deepface_service` → create venv → `pip install -r requirements.txt`
2. Add photos under `deepface_service/registered_faces/<PersonName>/`
3. Set `FACE_SOURCE` to your RTSP URL if needed
4. Run: `uvicorn main:app --host 0.0.0.0 --port 8001`
5. Open the admin **Live Feed** — the Detections panel uses WebSocket on port **8001**

**Direct Python vs REST API:** this repo uses **direct** DeepFace calls inside the FastAPI process (lowest latency). The optional DeepFace REST server is not required here.
