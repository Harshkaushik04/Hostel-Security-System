docker build -f Dockerfiles/node_backend.Dockerfile -t harsh42/dep_node_backend .
docker build -f Dockerfiles/sfu_server.Dockerfile -t harsh42/dep_sfu_server .
docker build -f Dockerfiles/mediamtx.Dockerfile -t harsh42/dep_mediamtx .
docker build -f Dockerfiles/frontend.Dockerfile -t harsh42/dep_frontend .
docker build -f Dockerfiles/fastapi_server.Dockerfile -t harsh42/dep_fastapi_server .