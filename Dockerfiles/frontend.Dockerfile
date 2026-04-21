FROM node:22.16.0-bookworm-slim
WORKDIR /app
COPY package* .
COPY frontend/package* /app/frontend/
COPY shared/package* /app/shared/
RUN npm install -w hostel-securiity -w @my-app/shared --include-workspace-root --ignore-scripts
COPY shared/ /app/shared/
WORKDIR /app/frontend 
COPY frontend/ .
CMD ["npm","run","dev"]