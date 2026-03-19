from __future__ import annotations

import argparse
from collections import deque

import cv2
import numpy as np

from .core import FaceEngine, load_known_db, save_known_db


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Enroll a person (store face embedding).")
    p.add_argument("--name", required=True, help="Label/name to store (e.g., YASH)")
    p.add_argument("--source", default="0", help='Video source: "0" for webcam or RTSP/URL/path')
    p.add_argument("--samples", type=int, default=20, help="How many face samples to capture")
    p.add_argument("--min_face", type=int, default=120, help="Minimum face box size (px) to accept")
    return p.parse_args()


def open_capture(source: str) -> cv2.VideoCapture:
    if source.isdigit():
        return cv2.VideoCapture(int(source))
    return cv2.VideoCapture(source)


def main() -> None:
    args = parse_args()
    cap = open_capture(args.source)
    if not cap.isOpened():
        raise SystemExit(f"Could not open source: {args.source}")

    engine = FaceEngine()

    collected: list[np.ndarray] = []
    recent = deque(maxlen=10)

    print(f'Enrolling "{args.name}" | target samples: {args.samples}')
    print("Show your face clearly to the camera. Press q to quit.")

    while True:
        ok, frame = cap.read()
        if not ok or frame is None:
            break

        dets = engine.detect(frame)
        dets = sorted(dets, key=lambda d: d.score, reverse=True)

        if dets:
            d = dets[0]
            if d.w >= args.min_face and d.h >= args.min_face:
                emb = engine.embedding(frame, d)
                recent.append(emb)

                if len(recent) >= 5 and len(collected) < args.samples:
                    mean_emb = np.mean(np.stack(list(recent), axis=0), axis=0)
                    collected.append(mean_emb)
                    recent.clear()

                cv2.rectangle(frame, (d.x, d.y), (d.x + d.w, d.y + d.h), (0, 255, 0), 2)

        cv2.putText(
            frame,
            f"Samples: {len(collected)}/{args.samples}  (q to quit)",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("Enroll", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if len(collected) >= args.samples:
            break

    cap.release()
    cv2.destroyAllWindows()

    if len(collected) == 0:
        raise SystemExit("No usable face samples collected. Try better lighting/closer face.")

    # One embedding per person (mean of samples) keeps recognition simple.
    person_emb = np.mean(np.stack(collected, axis=0), axis=0).astype(np.float32)

    known_embs, known_labels = load_known_db()
    known_embs = known_embs.reshape((-1, person_emb.shape[-1])).astype(np.float32)

    # replace if name already exists
    if args.name in known_labels:
        idx = known_labels.index(args.name)
        known_embs[idx] = person_emb
        print(f'Updated existing label: "{args.name}"')
    else:
        known_embs = np.vstack([known_embs, person_emb[None, :]]) if known_embs.size else person_emb[None, :]
        known_labels.append(args.name)
        print(f'Added new label: "{args.name}"')

    save_known_db(known_embs, known_labels)
    print("Saved database to data/known_faces.npz")


if __name__ == "__main__":
    main()

