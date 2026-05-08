#!/bin/zsh
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_ROOT"

./scripts/package-macos-app.zsh
open "$APP_ROOT/dist"
