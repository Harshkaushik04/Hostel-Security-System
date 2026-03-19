from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Final

import cv2
import numpy as np

from .download_models import ensure_models


ROOT: Final[Path] = Path(__file__).resolve().parents[1]
DATA_DIR: Final[Path] = ROOT / "data"
KNOWN_DB: Final[Path] = DATA_DIR / "known_faces.npz"


@dataclass(frozen=True)
class Detection:
    x: int
    y: int
    w: int
    h: int
    score: float


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32).reshape(-1)
    b = b.astype(np.float32).reshape(-1)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
    return float(np.dot(a, b) / denom)


def _as_int(v: float) -> int:
    return int(round(float(v)))


class FaceEngine:
    def __init__(self, input_size: tuple[int, int] = (640, 480)) -> None:
        self.input_size = input_size
        models = ensure_models()
        det_path = str(models["face_detection_yunet_2023mar.onnx"])
        rec_path = str(models["face_recognition_sface_2021dec.onnx"])

        self.detector = cv2.FaceDetectorYN_create(
            det_path,
            "",
            input_size,
            score_threshold=0.9,
            nms_threshold=0.3,
            top_k=5000,
        )
        self.recognizer = cv2.FaceRecognizerSF_create(rec_path, "")

    def set_input_size(self, w: int, h: int) -> None:
        self.input_size = (w, h)
        self.detector.setInputSize(self.input_size)

    def detect(self, frame_bgr: np.ndarray) -> list[Detection]:
        h, w = frame_bgr.shape[:2]
        if (w, h) != self.input_size:
            self.set_input_size(w, h)

        _, faces = self.detector.detect(frame_bgr)
        if faces is None or len(faces) == 0:
            return []

        out: list[Detection] = []
        for f in faces:
            # [x, y, w, h, score, ... landmarks ...]
            x, y, ww, hh, score = f[:5]
            out.append(
                Detection(
                    x=_as_int(x),
                    y=_as_int(y),
                    w=_as_int(ww),
                    h=_as_int(hh),
                    score=float(score),
                )
            )
        return out

    def embedding(self, frame_bgr: np.ndarray, det: Detection) -> np.ndarray:
        face_box = np.array([det.x, det.y, det.w, det.h], dtype=np.int32)
        aligned = self.recognizer.alignCrop(frame_bgr, face_box)
        emb = self.recognizer.feature(aligned)
        return emb.astype(np.float32)

    def identify(
        self,
        emb: np.ndarray,
        known_embs: np.ndarray,
        known_labels: list[str],
        threshold: float = 0.45,
    ) -> tuple[str, float]:
        if known_embs.size == 0:
            return ("Unknown", 0.0)

        best_i = -1
        best = -1.0
        for i in range(known_embs.shape[0]):
            s = _cosine_sim(emb, known_embs[i])
            if s > best:
                best = s
                best_i = i
        if best_i >= 0 and best >= threshold:
            return (known_labels[best_i], best)
        return ("Unknown", best)


def load_known_db(path: Path = KNOWN_DB) -> tuple[np.ndarray, list[str]]:
    if not path.exists():
        return (np.zeros((0, 128), dtype=np.float32), [])
    data = np.load(str(path), allow_pickle=True)
    embs = data["embeddings"].astype(np.float32)
    labels = [str(x) for x in data["labels"].tolist()]
    return embs, labels


def save_known_db(embs: np.ndarray, labels: list[str], path: Path = KNOWN_DB) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(str(path), embeddings=embs.astype(np.float32), labels=np.array(labels, dtype=object))

