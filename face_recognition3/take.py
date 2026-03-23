import cv2
import face_recognition
import os
import numpy as np

os.makedirs('faces', exist_ok=True)

name = input("Enter name: ")

cap = cv2.VideoCapture(0)

while True:
    success, frame = cap.read()
    if not success:
        print("Failed to capture frame")
        break

    cv2.imshow("Training - Press 'c' to capture or 'q' to quit", frame)

    if cv2.waitKey(1) & 0xFF == ord('c'):
        img_path = f'faces/{name}.jpg'
        cv2.imwrite(img_path, frame)
        print(f"Image saved at: {img_path}")

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(img_rgb)

        if encodings:
            np.save(f'faces/{name}_encoding.npy', encodings[0])
            print(f"Encoding saved for {name}")
        else:
            print("No face detected. Try again.")

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()