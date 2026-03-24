#!/bin/bash

# Navigate to the base app directory
cd ~/DEP/app/ || exit

# Name for the tmux session
SESSION="dep_dev"

# Check if the session already exists to avoid duplicates
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  # Create a new detached session and name the first window
  tmux new-session -d -s $SESSION -n "mongodb"
  tmux send-keys -t $SESSION:0 "mongod --dbpath ~/mongodb-data --bind_ip 127.0.0.1,10.230.170.57" C-m

  # Window 1: Node Backend
  tmux new-window -t $SESSION -n "node_backend"
  tmux send-keys -t $SESSION:1 "cd node_backend && npm run dev" C-m

  # Window 2: Frontend
  tmux new-window -t $SESSION -n "frontend"
  tmux send-keys -t $SESSION:2 "cd frontend && npm run dev" C-m

  # Window 3: MediaMTX
  tmux new-window -t $SESSION -n "mediamtx"
  tmux send-keys -t $SESSION:3 "cd mediaMTX_server && ./mediamtx" C-m

  # Window 4: SFU Server
  tmux new-window -t $SESSION -n "sfu_server"
  tmux send-keys -t $SESSION:4 "cd sfu_server && npm run dev" C-m
fi

# Attach your current terminal to the newly created session
tmux attach-session -t $SESSION