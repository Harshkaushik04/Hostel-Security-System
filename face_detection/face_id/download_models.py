from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Final

import requests
from tqdm import tqdm


ROOT: Final[Path] = Path(__file__).resolve().parents[1]
MODELS_DIR: Final[Path] = ROOT / "models"


@dataclass(frozen=True)
class ModelSpec:
    filename: str
    url: str
    sha256: str | None = None
    min_bytes: int = 0


SPECS: Final[list[ModelSpec]] = [
    # OpenCV Zoo - YuNet face detector
    ModelSpec(
        filename="face_detection_yunet_2023mar.onnx",
        url="https://huggingface.co/opencv/face_detection_yunet/resolve/main/face_detection_yunet_2023mar.onnx?download=true",
        sha256="8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
        min_bytes=50_000,
    ),
    # OpenCV Zoo - SFace face recognition model
    ModelSpec(
        filename="face_recognition_sface_2021dec.onnx",
        url="https://huggingface.co/opencv/face_recognition_sface/resolve/main/face_recognition_sface_2021dec.onnx?download=true",
        sha256="0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
        min_bytes=5_000_000,
    ),
]


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _download(url: str, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(dst.suffix + ".part")

    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        with tmp.open("wb") as f, tqdm(
            total=total if total > 0 else None,
            unit="B",
            unit_scale=True,
            desc=dst.name,
        ) as pbar:
            for chunk in r.iter_content(chunk_size=1024 * 128):
                if not chunk:
                    continue
                f.write(chunk)
                pbar.update(len(chunk))
    os.replace(tmp, dst)


def ensure_models() -> dict[str, Path]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out: dict[str, Path] = {}
    for spec in SPECS:
        path = MODELS_DIR / spec.filename
        needs_download = True
        if path.exists() and path.stat().st_size > 0:
            # Guard against Git-LFS/Xet pointer files (very small text files).
            if spec.min_bytes > 0 and path.stat().st_size < spec.min_bytes:
                needs_download = True
            else:
                needs_download = False
                if spec.sha256:
                    got = _sha256_file(path)
                    if got.lower() != spec.sha256.lower():
                        needs_download = True

        if needs_download:
            _download(spec.url, path)
        out[spec.filename] = path

    return out


def main() -> None:
    paths = ensure_models()
    print("Downloaded/verified models:")
    for name, p in paths.items():
        print(f"- {name}: {p}")


if __name__ == "__main__":
    main()

