# App icon & splash (your image)

TestFlight and the home screen use **`apps/mobile/assets/icon.png`** (configured in `app.config.ts`). Right now those files are dark placeholders — replace them with your logo.

## Quick setup (Mac)

1. Save your logo somewhere (e.g. Desktop `auxano-logo.png`).
2. From repo root:

```bash
chmod +x scripts/set-mobile-icon.sh
./scripts/set-mobile-icon.sh ~/Desktop/auxano-logo.png
```

3. Rebuild and resubmit (icons are baked into the binary):

```bash
cd apps/mobile
npm run build:ios
npm run submit:ios
```

## Manual replace

Copy your image **three times** (or use one file for all), each **1024×1024 PNG**:

| File | Purpose |
|------|---------|
| `assets/icon.png` | iOS/Android app icon, TestFlight, notifications |
| `assets/adaptive-icon.png` | Android adaptive icon foreground |
| `assets/splash-icon.png` | Launch splash (shown on `#111111` background) |

**Apple rules for App Store icon:**

- 1024×1024 px  
- **No transparency** (use a solid background in the image)  
- No rounded corners in the file (iOS masks it automatically)

## Splash

`splash` in `app.config.ts` uses `splash-icon.png` with `resizeMode: contain` on background `#111111`. Use a logo with padding or a square mark that looks good centered.

## App Store Connect (optional)

The icon in the **build** comes from Expo assets. You can also upload a 1024×1024 icon under **App Store Connect → Auxano → App Information** for listing art — use the same image for consistency.
