#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting PreLegal..."

# Start backend
cd "$ROOT_DIR/backend"
if ! command -v uv &>/dev/null; then
  echo "Error: uv is not installed. Install it from https://github.com/astral-sh/uv"
  exit 1
fi

uv sync > /dev/null 2>&1
nohup uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 > /tmp/prelegal-backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > /tmp/prelegal-backend.pid
echo "  Backend started (PID $BACKEND_PID) → http://localhost:8001"

# Start frontend
cd "$ROOT_DIR/frontend"
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed."
  exit 1
fi

npm install > /dev/null 2>&1
nohup npm run dev > /tmp/prelegal-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > /tmp/prelegal-frontend.pid
echo "  Frontend started (PID $FRONTEND_PID) → http://localhost:3000"

echo ""
echo "PreLegal is running."
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8001"
echo ""
echo "Run ./scripts/stop.sh to stop."
