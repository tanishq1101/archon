#!/bin/bash
# scripts/start.sh
# Helper script to run the local dev server and frontend dev server in parallel.

echo "🚀 Starting GhostBoard AI..."

# Ensure we are in workspace root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 1. Start Backend in background
echo "⚡ Starting FastAPI backend..."
if [ -d "backend/.venv" ]; then
    source backend/.venv/bin/activate
elif [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi

# Run backend on port 8000
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 2. Start Frontend
echo "💻 Starting React frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

# Handle shutdown cleanly
cleanup() {
    echo "Stopping GhostBoard AI..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
