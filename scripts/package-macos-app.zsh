#!/bin/zsh
set -euo pipefail

APP_NAME="Kids Schedule Studio"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
APP_BUNDLE="$DIST_DIR/${APP_NAME}.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
APP_RESOURCES_DIR="$RESOURCES_DIR/app"

mkdir -p "$MACOS_DIR" "$APP_RESOURCES_DIR/assets"

cp "$ROOT_DIR/index.html" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/styles.css" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/app.js" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/README.md" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/SECURITY.md" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/PRIVACY.md" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/Run Kids Schedule Studio.command" "$APP_RESOURCES_DIR/"
cp "$ROOT_DIR/assets/"*.png "$APP_RESOURCES_DIR/assets/"
if [[ -f "$ROOT_DIR/assets/AppIcon.icns" ]]; then
  cp "$ROOT_DIR/assets/AppIcon.icns" "$RESOURCES_DIR/"
fi

cat > "$CONTENTS_DIR/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>kids-schedule-studio</string>
  <key>CFBundleIdentifier</key>
  <string>local.kids-schedule-studio.app</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Kids Schedule Studio</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.15</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

cat > "$MACOS_DIR/kids-schedule-studio" <<'LAUNCHER'
#!/bin/zsh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../Resources/app" && pwd)"
PORT="${PORT:-4177}"
URL="http://127.0.0.1:${PORT}/index.html"
SERVER_PID=""
PYTHON_BIN="$(command -v python3 || true)"

cd "$APP_DIR"

if [[ -z "$PYTHON_BIN" ]]; then
  osascript -e 'display dialog "Python 3 is required to run Kids Schedule Studio." buttons {"OK"} default button "OK"'
  exit 1
fi

if ! lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  "$PYTHON_BIN" -m http.server "$PORT" --bind 127.0.0.1 >/tmp/kids-schedule-studio.log 2>&1 &
  SERVER_PID=$!
fi

sleep 1
open "$URL"

if [[ -n "$SERVER_PID" ]]; then
  wait "$SERVER_PID"
fi
LAUNCHER

chmod +x "$MACOS_DIR/kids-schedule-studio"
chmod +x "$APP_RESOURCES_DIR/Run Kids Schedule Studio.command"

if command -v ditto >/dev/null 2>&1; then
  ditto -c -k --keepParent "$APP_BUNDLE" "$DIST_DIR/${APP_NAME}.zip"
else
  (cd "$DIST_DIR" && zip -qry "${APP_NAME}.zip" "${APP_NAME}.app")
fi

echo "Created:"
echo "$APP_BUNDLE"
echo "$DIST_DIR/${APP_NAME}.zip"
