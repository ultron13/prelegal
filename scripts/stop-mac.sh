#!/usr/bin/env bash
# macOS stop script (same as Linux stop)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/stop.sh" "$@"
