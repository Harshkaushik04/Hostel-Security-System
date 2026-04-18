FROM node:22.16.0-bookworm-slim
WORKDIR /app
COPY package* .
COPY shared/package* /app/shared/
COPY node_backend/package* /app/node_backend/
RUN npm install -w node_backend -w @my-app/shared --include-workspace-root --ignore-scripts
COPY node_backend/ /app/node_backend/
COPY shared/ /app/shared/
WORKDIR /app/node_backend
RUN npm run build
EXPOSE 3000
CMD ["npm","run","start"]