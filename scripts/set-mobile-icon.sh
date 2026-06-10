#!/usr/bin/env bash
# Usage: ./scripts/set-mobile-icon.sh /path/to/your-logo.png
# Requires macOS `sips` (built in). Produces 1024×1024 PNGs for Expo / TestFlight.

set -euo pipefail
SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: ./scripts/set-mobile-icon.sh /path/to/your-image.png"
  echo "Tip: use a square PNG or JPG, at least 1024×1024."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/apps/mobile/assets"
mkdir -p "$ASSETS"

TMP="$ASSETS/.icon-work.png"
cp "$SRC" "$TMP"

# Square 1024×1024 (iOS App Store + home screen)
sips -z 1024 1024 "$TMP" --out "$ASSETS/icon.png" >/dev/null
cp "$ASSETS/icon.png" "$ASSETS/adaptive-icon.png"

# Splash: same logo centered on brand background (letterbox if not square)
SPLASH="$ASSETS/splash-icon.png"
cp "$ASSETS/icon.png" "$SPLASH"
# Optional: darken pad — splash uses backgroundColor #111111 in app.config.ts

rm -f "$TMP"

echo "Updated:"
echo "  $ASSETS/icon.png"
echo "  $ASSETS/adaptive-icon.png"
echo "  $ASSETS/splash-icon.png"
echo ""
echo "Next: cd apps/mobile && npm run build:ios && npm run submit:ios"
echo "(TestFlight only shows the new icon after a new build.)"
