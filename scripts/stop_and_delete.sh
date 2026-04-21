docker stop mongodb
docker rm mongodb

docker stop dep_frontend
docker rm dep_frontend

docker stop dep_node_backend
docker rm dep_node_backend

docker stop dep_mediamtx
docker rm dep_mediamtx

docker stop dep_sfu_server
docker rm dep_sfu_server

docker stop dep_fastapi_server
docker rm dep_fastapi_server
