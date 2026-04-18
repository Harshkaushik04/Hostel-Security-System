FROM alpine:3.22
RUN apk add --no-cache curl

COPY mediaMTX_server/ /app/mediaMTX_server

EXPOSE 8554
EXPOSE 8000
EXPOSE 8001
EXPOSE 9997
WORKDIR /app/mediaMTX_server
CMD ["./mediamtx"]