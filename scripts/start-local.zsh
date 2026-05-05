#!/bin/zsh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4177}"
URL="http://127.0.0.1:${PORT}/index.html"

cd "$APP_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required to run the local server."
  exit 1
fi

echo "Starting Kids Schedule Studio at ${URL}"
(sleep 1 && open "$URL" >/dev/null 2>&1 || true) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
