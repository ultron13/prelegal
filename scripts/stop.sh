#!/usr/bin/env bash

echo "Stopping PreLegal..."

for name in backend frontend; do
  PID_FILE="/tmp/prelegal-${name}.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      echo "  $name stopped (PID $PID)"
    fi
    rm -f "$PID_FILE"
  fi
done

echo "Done."
