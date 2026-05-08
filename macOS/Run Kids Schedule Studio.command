#!/bin/zsh
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4177}"
URL="http://127.0.0.1:${PORT}/index.html"

cd "$APP_ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display dialog "Python 3 is required to run Kids Schedule Studio. Install Python 3 from python.org, then run this again." buttons {"OK"} default button "OK"'
  exit 1
fi

if lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  open "$URL"
  echo "Kids Schedule Studio is already running at $URL"
  echo "You can close this Terminal window."
  exit 0
fi

echo "Starting Kids Schedule Studio..."
echo "$URL"
(sleep 1 && open "$URL" >/dev/null 2>&1 || true) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
