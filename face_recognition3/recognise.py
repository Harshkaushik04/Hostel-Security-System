import cv2
import face_recognition
import numpy as np
import os

def load_encodings(encodings_path):
    encodings = []
    class_names = []
    for file in os.listdir(encodings_path):
        if file.endswith("_encoding.npy"):
            class_name = file.split('_')[0]
            encoding = np.load(os.path.join(encodings_path, file))
            encodings.append(encoding)
            class_names.append(class_name)
    return encodings, class_names

encodings_path = 'faces'
known_encodings, class_names = load_encodings(encodings_path)

cap = cv2.VideoCapture(0)

while True:
    success, frame = cap.read()
    if not success:
        print("Failed to capture frame")
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    for face_encoding, face_location in zip(face_encodings, face_locations):
        matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
        name = "Unknown"

        if True in matches:
            first_match_index = matches.index(True)
            name = class_names[first_match_index].upper()

        y1, x2, y2, x1 = face_location
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.rectangle(frame, (x1, y2 - 20), (x2, y2), (0, 255, 0), cv2.FILLED)
        cv2.putText(frame, name, (x1 + 6, y2 - 6),
                    cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 255, 255), 2)

    cv2.imshow("Face Detection - Press 'q' to quit", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()