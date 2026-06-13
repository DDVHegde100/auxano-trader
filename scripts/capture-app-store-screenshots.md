# App Store screenshots (6.7" iPhone)

Apple requires screenshots for **6.7" display** (iPhone 15 Pro Max / 16 Pro Max). Use one of these methods.

## Option A — iOS Simulator (recommended)

```bash
# Boot 6.7" simulator
xcrun simctl list devices available | grep "Pro Max"

open -a Simulator
# Device → iPhone 16 Pro Max

cd apps/mobile
npm start
# Press i to open in simulator, sign in, capture screens:

# From Simulator menu: File → Save Screen (⌘S)
# Save as 1290×2796 PNG (native resolution)
```

### Suggested screens (6 shots)

1. **Dashboard** — portfolio value + live quotes
2. **Marketplace** — preset algorithms with strength scores
3. **Trade** — paper order with chart
4. **Bots** — autopilot list with run status
5. **Compete** — leagues / duels
6. **Strategy detail** — layman score + deploy buttons

## Option B — Physical device

1. Install TestFlight build on iPhone.
2. Navigate to each screen.
3. Side button + volume up → screenshot.
4. AirDrop to Mac.

## Option C — Web marketing frames

Use web app at `https://auxano-red.vercel.app` in a 1290×2796 browser frame (e.g. Figma device mockup) for listing art if mobile captures are delayed.

## Upload

App Store Connect → **Auxano** → **iOS App** → **Screenshots** → 6.7" → drag PNGs.

See also `APP_STORE_METADATA.md` for subtitle and description.
