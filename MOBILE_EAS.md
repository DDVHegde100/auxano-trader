# Mobile: production API + EAS / TestFlight

The iOS app talks to the same Next.js API as web. Production API: **https://auxano-red.vercel.app**

> **Active:** Full click-by-click guide → **[TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md)**. You need Apple Team ID + App Store Connect app id in `eas.json`, Clerk `pk_*` in `.env.production` + EAS env, then `eas init` + `npm run mobile:build:ios:preview`.

## 1. Production env (local + EAS)

Copy and fill Clerk key (same publishable key as Vercel web):

```bash
cp apps/mobile/.env.production.example apps/mobile/.env.production
```

| Variable | Production value |
|----------|------------------|
| `EXPO_PUBLIC_API_URL` | `https://auxano-red.vercel.app` |
| `EXPO_PUBLIC_USE_DEV_AUTH` | `false` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` from Clerk |

`eas.json` already sets API URL and `USE_DEV_AUTH=false` for **preview** and **production** builds. You still must provide the Clerk key (see below).

### Clerk key on EAS (required for store builds)

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_xxx" --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_xxx" --environment preview --visibility plaintext
```

Or add the same variable in [expo.dev](https://expo.dev) → your project → **Environment variables**.

In **Clerk Dashboard** → Configure → allow origins:

- `https://auxano-red.vercel.app`
- `auxano://` (mobile scheme from `app.config.ts`)

## 2. One-time EAS + Apple setup

**Prerequisites:** Apple Developer Program ($99/yr), Expo account (free tier works for internal builds).

```bash
cd apps/mobile
npm install
npx eas-cli login
npx eas-cli init   # links project; writes projectId into Expo dashboard
```

iOS bundle ID (fixed in repo): **`app.auxano.mobile`**

Create the app in [App Store Connect](https://appstoreconnect.apple.com) with that bundle ID, then edit `eas.json` → `submit.production.ios`:

- `appleTeamId` — from Apple Developer → Membership
- `ascAppId` — numeric App Store Connect app id

EAS creates **distribution certificate** and **provisioning profile** on first build (or run `npx eas credentials`).

## 3. Build & TestFlight

Preflight (API reachable from your machine):

```bash
npm run verify:deploy -- https://auxano-red.vercel.app
```

**Internal / TestFlight candidate (preview profile):**

```bash
npm run mobile:build:ios:preview
```

**App Store / TestFlight production track:**

```bash
npm run mobile:build:ios
```

After the build finishes:

```bash
cd apps/mobile
npx eas submit --platform ios --profile production --latest
```

Or in Expo dashboard: **Build** → **Submit to App Store Connect** → enable **TestFlight** internal testing.

### Test on a physical iPhone before TestFlight

1. Install [Expo Go](https://expo.dev/go) or a **development** EAS build.
2. Set `apps/mobile/.env` to production values (or use preview build).
3. Sign in with **Clerk** (not dev auth when `EXPO_PUBLIC_USE_DEV_AUTH=false`).
4. Confirm dashboard loads quotes and marketplace (hits prod API + Supabase).

## 4. Scripts (from repo root)

| Script | Action |
|--------|--------|
| `npm run mobile:build:ios` | EAS production iOS build |
| `npm run mobile:build:ios:preview` | EAS internal preview build |
| `npm run mobile:eas:init` | Link Expo project |
| `npm run verify:deploy` | Health check prod API |

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Sign-in fails on device | Clerk key + `EXPO_PUBLIC_USE_DEV_AUTH=false`; add `auxano://` in Clerk |
| API errors / empty data | `curl https://auxano-red.vercel.app/api/health`; fix Vercel `DATABASE_URL` |
| Build fails credentials | `cd apps/mobile && npx eas credentials` |
| `/api/ready` 503 | Clerk **test** keys warn in prod; DB must be pooler URL (see [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)) |

See also [SETUP.md](./SETUP.md), [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md), [DOMAINS.md](./DOMAINS.md).
