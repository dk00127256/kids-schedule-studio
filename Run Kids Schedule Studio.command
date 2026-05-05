#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"
PORT=4177
URL="http://127.0.0.1:${PORT}/index.html"

if ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display dialog "Python 3 is required to run Kids Schedule Studio." buttons {"OK"} default button "OK"'
  exit 1
fi

if ! lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  python3 -m http.server "${PORT}" --bind 127.0.0.1 >/tmp/kids-schedule-studio.log 2>&1 &
fi

sleep 1
open "${URL}"
