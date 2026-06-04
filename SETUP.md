# Auxano Trader — Production setup guide

This document explains **every environment variable**, how to obtain each secret, and how to move from local dev to a production-ready stack.

**Current auth in code:** [Clerk](https://clerk.com) (web + mobile) with an optional **dev login** bypass. **Firebase** is not wired yet; a full Firebase walkthrough is below if you want to replace Clerk.

**Data:** PostgreSQL via Prisma (not Firestore).

**Market data:** Yahoo Finance (no key) + optional Finnhub.

---

## What you need from me (checklist)

| Item | Required for | You provide |
|------|----------------|-------------|
| PostgreSQL URL | All environments | Hosted DB URL (Neon, Supabase, RDS) |
| Clerk app keys | Production login | Publishable + secret key from Clerk dashboard |
| Finnhub API key | Optional better quotes | Free key from finnhub.io |
| Firebase project | Only if migrating auth | Web app config + Admin service account |
| Vercel / hosting | Web deploy | GitHub repo access |
| Apple / Google | OAuth + App Store | Developer accounts (when shipping mobile) |

---

## Environment files

| File | App | Committed? |
|------|-----|------------|
| `apps/web/.env.local` | Next.js API + web | **No** — create locally |
| `apps/mobile/.env` | Expo | **No** |
| `packages/database/.env` | Prisma CLI | **No** |

Copy examples:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
cp packages/database/.env.example packages/database/.env
```

---

## Web (`apps/web/.env.local`)

### `DATABASE_URL`

- **What it does:** Connects the API and Prisma to PostgreSQL (users, paper accounts, orders, strategies, quotes).
- **Local:** `postgresql://postgres:postgres@localhost:5433/auxano?schema=public` (Docker from `npm run start`).
- **Production:** Create a project on [Neon](https://neon.tech) or [Supabase](https://supabase.com). Copy the **pooled** connection string with `?sslmode=require`.
- **How to get:** Dashboard → Connection string → paste into Vercel/host env as `DATABASE_URL`.

### `FINNHUB_API_KEY`

- **What it does:** Optional fallback for live stock quotes and search when Yahoo is rate-limited. If empty, Yahoo is used alone.
- **Required?** No for dev; recommended for production reliability.
- **How to get:**
  1. Sign up at [finnhub.io](https://finnhub.io/register).
  2. Dashboard → **API Key**.
  3. Free tier: 60 calls/minute.
- **Never commit** this key to git.

### `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

- **What it does:** Client-side Clerk SDK (sign-in UI, session on browser).
- **How to get:**
  1. [dashboard.clerk.com](https://dashboard.clerk.com) → Create application **Auxano Trader**.
  2. **API Keys** → copy **Publishable key** (`pk_test_...` or `pk_live_...`).

### `CLERK_SECRET_KEY`

- **What it does:** Server verifies JWTs, creates/finds users in Prisma, protects API routes.
- **How to get:** Same Clerk page → **Secret key** (`sk_test_...` / `sk_live_...`). **Server only** — never expose to mobile as `NEXT_PUBLIC_*`.

### `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` / `AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL`

- **What they do:** Clerk redirect paths after auth.
- **Defaults:** `/sign-in`, `/sign-up`, `/dashboard`, `/onboarding` — usually fine as-is.

### `ALLOW_DEV_AUTH` / `NEXT_PUBLIC_ALLOW_DEV_AUTH`

- **What they do:** Enable email/password dev login (`test@gmail.com` / `Test1234!`) without Clerk.
- **Local:** `true` is fine.
- **Production:** **Must be `false` or unset.** Otherwise anyone can bypass real auth.

### `DEV_AUTH_SECRET`

- **What it does:** Signs the dev session cookie when `ALLOW_DEV_AUTH=true`.
- **Production:** Omit or use a long random string only on private staging; never use default in public prod.

---

## Mobile (`apps/mobile/.env`)

### `EXPO_PUBLIC_API_URL`

- **What it does:** Base URL for all mobile API calls (must point to your Next.js server).
- **Simulator:** `http://localhost:3000`
- **Physical iPhone:** Your Mac’s LAN IP, e.g. `http://192.168.1.42:3000` (not `localhost`).
- **Production:** `https://api.yourdomain.com` or your Vercel URL.

### `EXPO_PUBLIC_USE_DEV_AUTH`

- **What it does:** Mobile uses dev login flow against `/api/auth/dev-login` instead of Clerk.
- **Production:** `false`.

### `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

- **What it does:** Clerk Expo SDK when dev auth is off.
- **How to get:** Same publishable key as web (`pk_live_...` in production).

---

## Database package (`packages/database/.env`)

Usually the same `DATABASE_URL` as web. Used for:

```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Firebase — setup from scratch (if you want Firebase Auth)

Auxano does **not** ship Firebase Auth yet. This is the path to add it and go production-grade with Google/Apple/email sign-in.

### Step 1 — Create the project

1. Go to [Firebase Console](https://console.firebase.google.com).
2. **Add project** → name: `Auxano Trader` (or `auxano-trader`).
3. Disable Google Analytics if you want minimal setup (you can enable later).
4. Wait for project creation.

### Step 2 — Register apps

**Web**

1. Project overview → **Web** (`</>`).
2. App nickname: `auxano-web`.
3. Copy the `firebaseConfig` object — you will map these to env vars below.

**iOS** (when you build with EAS / native)

1. Add **iOS** app, bundle ID e.g. `com.auxano.trader`.
2. Download `GoogleService-Info.plist` for EAS.

### Step 3 — Enable Authentication

1. **Build → Authentication → Get started**.
2. **Sign-in method** tab:
   - **Email/Password** → Enable (turn on **Email link** only if you want passwordless).
   - **Google** → Enable → set support email → copy Web client ID if needed for mobile.
   - **Apple** → Enable (required for App Store if you offer other social logins).
3. **Settings → Authorized domains:** add `localhost`, your Vercel domain (`*.vercel.app`), and your custom domain.

### Step 4 — What to send / store (secrets)

**Client (safe in app, prefixed `NEXT_PUBLIC_` on web):**

| Env variable | Firebase console field |
|--------------|------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |

**Server only (Admin SDK — verify ID tokens on API):**

1. **Project settings → Service accounts → Generate new private key** (JSON file).
2. Store in CI/host secrets, **never in git**.
3. Map to:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

(Use literal `\n` newlines in Vercel env for the private key.)

### Step 5 — Connect Firebase to Auxano’s database

You still need **PostgreSQL**. Flow:

1. User signs in with Firebase on client → get **ID token**.
2. Mobile/web sends `Authorization: Bearer <firebase_id_token>` to your API.
3. API verifies token with Firebase Admin → read `uid` / email.
4. Prisma: `upsert` user by `firebaseUid` (today the schema uses `clerkId` — migration adds `firebaseUid` or replaces Clerk).

**Work required in repo:** replace Clerk middleware, add Firebase Admin verify, update `requireDbUser` in `apps/web/src/lib/auth.ts`, Expo `@react-native-firebase/auth` or Firebase JS SDK.

### Step 6 — Do not use Firestore as primary DB

Keep portfolios, orders, and strategies in **PostgreSQL**. Use Firebase for auth, push (FCM), crashlytics, remote config only.

### Step 7 — Optional Firebase services (later)

| Service | Use |
|---------|-----|
| **FCM** | Price alerts, strategy notifications |
| **Crashlytics** | Mobile crash reporting |
| **App Check** | Protect public APIs from abuse |
| **Remote Config** | Feature flags (`maintenance_mode`, etc.) |

Enable **Blaze** billing if you add Cloud Functions.

---

## Clerk vs Firebase (decision)

| | Clerk (current) | Firebase Auth |
|--|-----------------|---------------|
| Setup time | ~30 minutes | ~2–4 hours + code migration |
| Web + Expo | Official SDKs | Firebase JS / RN Firebase |
| User sync | `clerkId` in Prisma | `firebaseUid` in Prisma |
| Production ready | Yes, with live keys | Yes, after migration |

**Fastest path to production:** keep Clerk, disable dev auth, deploy DB + Vercel.

---

## Production launch sequence

1. **Database:** Neon/Supabase → `DATABASE_URL` → `prisma migrate deploy`.
2. **Clerk:** Switch to **live** keys (`pk_live_`, `sk_live_`). Configure allowed origins and OAuth providers in Clerk dashboard.
3. **Web:** Deploy `apps/web` to Vercel. Set all env vars in Vercel project settings.
4. **Disable dev auth:** `ALLOW_DEV_AUTH=false`, remove `DEV_AUTH_SECRET` from production.
5. **Finnhub:** Add `FINNHUB_API_KEY` for stable quotes.
6. **Mobile:** Set `EXPO_PUBLIC_API_URL` to production API, `EXPO_PUBLIC_USE_DEV_AUTH=false`, Clerk publishable key. Build with EAS.
7. **Legal:** Privacy policy + Terms (paper trading disclaimer) before public users.
8. **Monitoring:** Add Sentry (not in repo yet) — see `PRODUCTION.md`.

---

## Security reminders

- Do not commit `.env.local`, `.env`, or Firebase JSON service accounts.
- Rotate any key that was ever committed (including Finnhub keys in chat/logs).
- Use **live** Clerk keys only on production host.
- `CLERK_SECRET_KEY` and `FIREBASE_PRIVATE_KEY` are **server-only**.

---

## Database setup (commit 1)

```bash
# Local Postgres (works when Supabase host is paused / unreachable)
npm run db:setup

# When Supabase project is live — auto-probe pooler + direct hosts
npm run db:setup:supabase -- 'your-db-password'

# Fix Next.js ENOENT _document.js (stale cache)
npm run web:clean
# or: cd apps/web && npm run build:clean && npm run dev
```

**Supabase note:** If `db.oaupmyhtwcnilmmsleyu.supabase.co` does not resolve, open the dashboard → **Restore project** → copy the exact **URI** from Settings → Database.

## Clerk sign-up

1. Clerk Dashboard → **Webhooks** → add endpoint `https://your-domain/api/webhooks/clerk` (local: use ngrok for testing).
2. Subscribe to `user.created`. Copy signing secret → `CLERK_WEBHOOK_SECRET` in `.env.local`.
3. Without webhook, the app still creates users on first visit via `getOrCreateDbUser`.

## Quick reference — who uses what

```
Browser / Expo
  → Clerk (or Firebase) login
  → Bearer token or session cookie
  → Next.js API (apps/web)
       → Prisma → PostgreSQL
       → Yahoo / Finnhub → quotes
```

For local dev steps, see [START.md](./START.md).

## Vercel + health (items 5–6)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/live` | Liveness — process up |
| `GET /api/ready` | Readiness — DB + Clerk + env (503 if not ready) |
| `GET /api/health` | Full report (DB, Clerk API ping, env, market) |

```bash
# After deploy
npm run verify:deploy -- https://your-app.vercel.app
```

Mobile: set `EXPO_PUBLIC_API_URL` to the same URL. CORS is enabled on `/api/*` for Expo Bearer tokens.

Deploy guide: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

For the 20-commit production roadmap, see [PRODUCTION.md](./PRODUCTION.md).


Drag-and-drop live paper bot
Multi-asset portfolios per strategy
Strategy versioning / fork
Alert when RSI/MA rules trigger
Optimization (parameter sweeps)
Import/export strategy as file
Collaboration / comments on strategies (comments API exists but light)

Friend system — UserFollow exists in Prisma, but no friend requests, accept/decline, or “friends only” APIs/UI. Only follow a strategy (/api/strategies/[slug]/follow).
Public / private profile — No isProfilePublic (or similar) on User. No “hide portfolio unless friended.”

Export share card — No PNG/PDF export of performance or strategy summary.

Strategy summary card for sharing — Builder has backtest preview; no shareable card or link.

Social competition — No challenges, leagues, or compare-to-friend.

Notifications for social/trading — Notification model exists; no push (FCM/APNs) or in-app notification center wired end-to-end.

Live leaderboard updates — No cron/job to refresh ranks when trades happen.

Production deploy + stable API — Blocking TestFlight and real multi-user use.

Automated strategy execution — Strategies gate manual buys; no bot running your blocks/Python on a schedule against live prices.

Rich strategy IDE — Blocks + Python + backtest + publish exist; missing: versioning, walk-forward tests, multi-symbol portfolios, live paper deployment loop, alerts when rules fire.


--

1. ~~Fix Supabase DATABASE_URL + prisma db push~~ — local DB works; use `npm run db:setup:supabase` when Supabase is live
2. ~~Commit & push~~ — run `git push origin main` after each release
3. ~~Clerk prod paths + email verification docs~~ — see `/docs/authentication` in the web app
4. ~~ALLOW_DEV_AUTH=false in CI~~ — `scripts/check-prod-env.mjs` + `.github/workflows/ci.yml`
5. ~~Vercel deploy + env on Vercel~~ — [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md), `apps/web/vercel.json`
6. ~~Health `/api/health` + `/api/ready` + `/api/live`~~ — ops + mobile preflight; `npm run verify:deploy`
7
Add eas.json + iOS bundle + credentials
TestFlight builds
8
Mobile prod env (EXPO_PUBLIC_API_URL, Clerk)
Phone hits prod API
9
Leaderboard: live quotes + refresh after trade
Accurate top 10
10
User profile page + isProfilePublic + API
Privacy foundation
11
Friend requests API (UserFollow + pending state)
Social compete
12
Friends-only visibility on leaderboard/profile
Your privacy model
13
Strategy summary + export card (image/share sheet)
Shareable performance
14
Legal pages (privacy, terms, paper disclaimer)
App Store
15
EAS TestFlight build + internal testing notes