FROM node:22.16.0-bookworm
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg
COPY package* .
COPY shared/package* /app/shared/
COPY sfu_server/package* /app/sfu_server/
# Install all deps, scripts suppressed
RUN npm install --ignore-scripts

# Manually install the missing dep that mediasoup's build script needs
RUN npm install --prefix /app/node_modules/node-fetch formdata-polyfill data-uri-to-buffer fetch-blob

# Now rebuild mediasoup with its full dep chain available
RUN npm rebuild mediasoup
COPY shared/ /app/shared/
WORKDIR /app/sfu_server
COPY sfu_server/ .

EXPOSE 2000
EXPOSE 40000-40099/tcp
EXPOSE 40000-40099/udp
CMD ["npx", "tsx", "src/server.ts"]