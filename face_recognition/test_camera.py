import cv2
import os
import time

# 1. Target the exact stream your FastAPI server uses
CAMERA_NAME = "camera3"
RTSP_URL = f"rtsp://localhost:8554/{CAMERA_NAME}"

print(f"[*] Attempting to connect to: {RTSP_URL}")

# 2. Replicate the aggressive low-latency flags from your FastAPI script
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

# 3. Open the connection
cap = cv2.VideoCapture(RTSP_URL)

if not cap.isOpened():
    print(f"[ERROR] Could not open video stream at {RTSP_URL}.")
    print("Check if MediaMTX is running and the camera is actually publishing.")
    exit(1)

print("[*] Connection successful! Opening video window...")
print("[*] Press 'q' on your keyboard while the video window is selected to exit.")

fps_timer = time.time()
frame_counter = 0

try:
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("[WARNING] Frame dropped or stream disconnected. Retrying...")
            time.sleep(0.5)
            continue

        # Calculate basic FPS to see if the stream is smooth
        frame_counter += 1
        if (time.time() - fps_timer) > 1.0:
            fps = frame_counter / (time.time() - fps_timer)
            # Print FPS to terminal, overwriting the same line
            print(f"\rStream FPS: {fps:.1f}", end="", flush=True)
            frame_counter = 0
            fps_timer = time.time()

        # Display the frame in a GUI window
        cv2.imshow(f"MediaMTX Stream Debugger - {CAMERA_NAME}", frame)

        # Break the loop if the user presses 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("\n[*] Exiting by user request.")
            break

except KeyboardInterrupt:
    print("\n[*] Exiting by keyboard interrupt.")

finally:
    # Clean up
    cap.release()
    cv2.destroyAllWindows()
    print("[*] Cleaned up connections.")