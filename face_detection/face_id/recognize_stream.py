from __future__ import annotations

import argparse
import time

import cv2

from .core import FaceEngine, load_known_db


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run face recognition on a live stream.")
    p.add_argument("--source", default="0", help='Video source: "0" for webcam or RTSP/URL/path')
    p.add_argument("--threshold", type=float, default=0.45, help="Cosine similarity threshold for a match")
    p.add_argument("--draw_boxes", action="store_true", help="Draw face boxes")
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
    known_embs, known_labels = load_known_db()
    if not known_labels:
        print('No enrolled faces found. Run: python -m face_id.enroll --name YASH')

    last_t = time.time()
    fps = 0.0

    while True:
        ok, frame = cap.read()
        if not ok or frame is None:
            break

        dets = engine.detect(frame)
        dets = sorted(dets, key=lambda d: d.score, reverse=True)[:5]

        best_name = "Unknown"
        best_score = 0.0

        for d in dets:
            emb = engine.embedding(frame, d)
            name, score = engine.identify(emb, known_embs, known_labels, threshold=args.threshold)
            if score > best_score:
                best_score = score
                best_name = name

            if args.draw_boxes:
                cv2.rectangle(frame, (d.x, d.y), (d.x + d.w, d.y + d.h), (0, 255, 255), 2)
                cv2.putText(
                    frame,
                    f"{name} ({score:.2f})",
                    (d.x, max(20, d.y - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 255),
                    2,
                    cv2.LINE_AA,
                )

        now = time.time()
        dt = now - last_t
        if dt > 0:
            fps = 0.9 * fps + 0.1 * (1.0 / dt)
        last_t = now

        cv2.putText(
            frame,
            f"IDENTITY: {best_name}",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.1,
            (0, 255, 0) if best_name != "Unknown" else (0, 0, 255),
            3,
            cv2.LINE_AA,
        )
        cv2.putText(
            frame,
            f"FPS: {fps:.1f}",
            (10, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
        cv2.putText(
            frame,
            "q: quit",
            (10, 115),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("Face Recognition", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()