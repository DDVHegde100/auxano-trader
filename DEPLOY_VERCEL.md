# Deploy Auxano Trader to Vercel

Monorepo web app: `apps/web` (Next.js 15). Mobile (`apps/mobile`) calls this API via `EXPO_PUBLIC_API_URL`.

## 1. Prerequisites

- GitHub repo: https://github.com/DDVHegde100/auxano-trader
- PostgreSQL URL (Supabase / Neon) — run `npm run db:push` against prod once
- Clerk **live** keys for production
- Vercel account: https://vercel.com

## 2. Create Vercel project

1. **Add New Project** → Import `auxano-trader` from GitHub.
2. **Root Directory:** `apps/web` (important for monorepo).
3. Framework Preset: **Next.js** (auto-detected).
4. Build settings (also in `apps/web/vercel.json`):
   - Install: `cd ../.. && npm ci`
   - Build: `cd ../.. && npm run db:generate && npm run build --workspace=@auxano/web`

## 3. Environment variables

In Vercel → Settings → Environment Variables, add everything from `apps/web/.env.production.example`.

| Variable | Production | Preview |
|----------|------------|---------|
| `DATABASE_URL` | Supabase/Neon URI | Same or staging DB |
| `CLERK_SECRET_KEY` | `sk_live_...` | `sk_test_...` OK |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | `pk_test_...` OK |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR.vercel.app` | Preview URL |
| `ALLOW_DEV_AUTH` | `false` | `false` |
| `NEXT_PUBLIC_ALLOW_DEV_AUTH` | `false` | `false` |
| `ALLOWED_ORIGINS` | `*` or your Expo origins | `*` |
| `FINNHUB_API_KEY` | optional | optional |
| `CLERK_WEBHOOK_SECRET` | optional | optional |

After first deploy, set `NEXT_PUBLIC_APP_URL` to your canonical URL and redeploy.

## 4. Clerk production URLs

Clerk Dashboard → **Configure** → **Paths** / **Domains**:

- Sign-in: `/sign-in`
- Sign-up: `/sign-up`
- After sign-in: `/dashboard`
- After sign-up: `/onboarding`
- Allowed origins: `https://YOUR.vercel.app` and custom domain

Webhook (optional): `https://YOUR.vercel.app/api/webhooks/clerk` → `user.created`

## 5. Verify deployment

```bash
# Liveness (always 200)
curl -s https://YOUR.vercel.app/api/live | jq

# Readiness (200 = DB + Clerk OK)
curl -s https://YOUR.vercel.app/api/ready | jq

# Full health report
curl -s https://YOUR.vercel.app/api/health | jq
```

Or run locally against prod:

```bash
npm run verify:deploy -- https://YOUR.vercel.app
```

## 6. Mobile app (Expo / EAS)

Production API for this deploy: **https://auxano-red.vercel.app**

```bash
cp apps/mobile/.env.production.example apps/mobile/.env.production
# Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to the same pk_* as Vercel web
```

TestFlight / App Store builds: [MOBILE_EAS.md](./MOBILE_EAS.md) (`npm run mobile:build:ios`).

The API enables CORS for mobile `Authorization: Bearer <clerk_token>` requests.

## 7. Custom domain (optional)

Vercel → Domains → add `api.auxano.app` (example) → update `NEXT_PUBLIC_APP_URL` and Clerk allowed domains.

## 8. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `db:generate` runs in build (see `vercel.json`) |
| `/api/ready` 503 | Check `DATABASE_URL` SSL and Supabase not paused |
| Clerk 401 on mobile | Use live keys; pass Clerk session token as Bearer |
| CORS error on device | Set `ALLOWED_ORIGINS=*` or add Expo origin |

See also [SETUP.md](./SETUP.md) and [START.md](./START.md).
