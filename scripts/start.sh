docker run --name mongodb --network dep_network -d -p 27017:27017 -v ~/mongodb-data:/data/db mongo
docker run --name dep_node_backend --network dep_network -d -p 3000:3000 -e MONGO_URL="mongodb://mongodb:27017/DEP" harsh42/dep_node_backend 
docker run --name dep_sfu_server --network dep_network -d -p 40000-40099:40000-40099 -p 2000:2000 -e MEDIAMTX_IP="dep_mediamtx" harsh42/dep_sfu_server
docker run --name dep_mediamtx --network dep_network -d -p 8000:8000 -p 8001:8001 -p 8554:8554 -p 9997:9997 -e SFU_HOST="dep_sfu_server" -e FASTAPI_HOST="dep_fastapi_server" harsh42/dep_mediamtx:latest
docker run --name dep_frontend --network dep_network -d -p 5173:5173 harsh42/dep_frontend:latest 
docker run --name dep_fastapi_server --network dep_network -d -p 6500:6500 harsh42/dep_fastapi_server:latest