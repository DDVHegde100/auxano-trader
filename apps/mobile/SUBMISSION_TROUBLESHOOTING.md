# iOS submission troubleshooting

If `npm run submit:ios` fails with Expo API or Apple upload errors, use one of these paths.

## Option A — Retry EAS submit

```bash
cd apps/mobile
npm run submit:ios          # latest production build
npm run submit:ios:retry    # explicit build id (set in package.json)
```

## Option B — Transporter (manual, most reliable)

1. Open [expo.dev](https://expo.dev) → **auxano** → latest **finished** iOS production build.
2. Download the `.ipa` from **Application Archive URL**.
3. Install **Transporter** from the Mac App Store.
4. Sign in with your Apple Developer Apple ID → drag the `.ipa` → **Deliver**.

## Option C — Expo dashboard

expo.dev → project → build → **Submit to App Store** (uses the same API key as CLI).

## Common errors

| Error | Fix |
|-------|-----|
| `90725` iOS 26 SDK required | `eas.json` → `ios.image: "latest"` (already set) |
| `ENOTFOUND api.expo.dev` | Retry submit; or use Transporter |
| Generic Apple upload timeout | Use Transporter; uploads can take 15–30 min |
| Missing compliance | App Store Connect → build → Export Compliance → No (exempt) |

## After upload

App Store Connect → **TestFlight** → wait for Processing → add build to Internal Testing group.
