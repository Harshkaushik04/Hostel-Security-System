FROM python:3.10-slim

WORKDIR /app
RUN pip install --no-cache-dir --upgrade pip
RUN apt-get update && apt-get install -y \
    libzbar0 \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*
COPY face_recognition/requirements.txt /app/face_recognition/requirements.txt
RUN pip install -r face_recognition/requirements.txt

WORKDIR /app/face_recognition
COPY face_recognition/ .
EXPOSE 6500
CMD ["python3","fastapi_server.py"]