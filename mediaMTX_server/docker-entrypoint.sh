#!/bin/sh
# If SFU_HOST is set, patch the runOnReady/runOnNotReady in the yml before starting
if [ -n "$SFU_HOST" ]; then
  FASTAPI_HOST="${FASTAPI_HOST:-$SFU_HOST}"
  sed -i \
    "s|http://127.0.0.1:2000|http://${SFU_HOST}:2000|g; \
     s|http://127.0.0.1:6500|http://${FASTAPI_HOST}:6500|g" \
    /app/mediaMTX_server/mediamtx.yml
fi
exec ./mediamtx