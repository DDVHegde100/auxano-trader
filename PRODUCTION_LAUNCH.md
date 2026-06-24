# Auxano — Production launch guide (mobile-first)

This document lists **what is already built in code**, **what only you can do** (dashboards & credentials), and **the exact order** to ship TestFlight / App Store.

> **Mobile-only?** You do not need to use the website in a browser. Vercel hosts the **API** only (`https://auxano-red.vercel.app`). The iOS app talks to that URL.

---

## Part A — Already implemented in the repo

These items are **done in code** — no further programming required for v1:

| Feature | Location |
|---------|----------|
| Email/password auth (OAuth removed) | `apps/mobile/app/(auth)/` |
| Email verification on sign-up | Clerk + `sign-up.tsx` |
| Forgot password | `apps/mobile/app/(auth)/forgot-password.tsx` |
| Settings (account, reset password, legal, logout) | `apps/mobile/app/settings.tsx` |
| Auth guards (tabs + protected screens) | `useRequireAuth`, `(tabs)/_layout.tsx` |
| Legal pages (Privacy, Terms) | `apps/mobile/app/legal/` |
| Legal footer on sign-in / sign-up | `LegalFooter.tsx` |
| Paper trading disclaimers | `PaperDisclaimerBanner` on Trade/Bots |
| Onboarding → deploy first bot (autopilot) | `apps/mobile/app/onboarding.tsx` |
| Server autopilot (runs when app closed) | Vercel cron `/api/cron/autopilot` daily (Hobby plan; upgrade for more frequent runs) |
| EAS bundle ID + ASC app ID | `app.config.ts`, `eas.json` |
| Clerk publishable key in EAS builds | `eas.json` production/preview env |
| App Store screenshots 1290×2796 | `apps/mobile/app-store-screenshots/6.7-inch/` |
| Web layout polish (header + 6-tab nav) | `app-shell.tsx` |

### Verify code readiness locally

```bash
npm run verify:production-ready
npm run test:auth          # local API must be running
npm run screenshots        # regenerate 6.7" PNGs if UI changed
```

---

## Part B — Information we need from YOU

Fill this in as you go. **Do not commit passwords to git.**

### Credentials worksheet (copy & fill locally)

Save this in your password manager or a local note — **not in git**:

```
AUXANO LAUNCH CHECKLIST
=======================

Supabase
  Project ref:     ________________________________
  DB password:     ________________________________  (rotate if ever shared)
  Connection URI:  ________________________________

Clerk (https://dashboard.clerk.com)
  Publishable key: pk_test________________________  (already in eas.json)
  Secret key:      sk_test________________________  → Vercel only
  Webhook secret:  whsec__________________________  → Vercel only

Vercel (https://vercel.com → auxano-red)
  DATABASE_URL:    (paste Supabase URI)
  CRON_SECRET:     (openssl rand -hex 32)
  All env vars saved + Production redeployed:  ☐

Apple
  Team ID:         D49RVY375B
  Bundle ID:       app.auxano.mobile
  ASC App ID:      6776782489
  TestFlight tester email: ________________________

Smoke test account (new email, not test@gmail.com)
  Email:           ________________________________
  Password:        ________________________________
```

---

### 1. Supabase (database)

| Field | Your value | Status |
|-------|------------|--------|
| Project ref | e.g. `hpwccagvpidxwsjthrhc` | ☐ |
| Database password | (set in Supabase → reset if shared) | ☐ |
| **Connection string (URI)** | From **Project Settings → Database → Connection string** | ☐ |

**Important:** Copy the URI from the dashboard — do not guess the host. Use **Direct connection** for `db push`, or **Session pooler** if direct fails.

**Troubleshooting connection errors**

| Error | Fix |
|-------|-----|
| `Can't reach database server` / DNS fails on `db.YOUR_REF.supabase.co` | Project may still be provisioning — wait 5–10 min, or use **Session pooler** URI from dashboard |
| `tenant/user postgres.YOUR_REF not found` on pooler | Wrong **region** in pooler URL — copy exact string from Supabase, don't hand-edit host |
| `password authentication failed` | Reset password in Supabase → Database → Database password |
| Vercel `/api/ready` shows database ✗ | `DATABASE_URL` missing or wrong on Vercel → redeploy after fixing |

After you have the URI:

```bash
# packages/database/.env  (gitignored)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres?schema=public&sslmode=require"

npm run db:push
npm run db:seed
```

---

### 2. Vercel (API host — required for phone app)

Project: **auxano-red** → [vercel.com](https://vercel.com)

Set these **Environment Variables** for **Production** (and Preview):

| Variable | Where to get it | Required |
|----------|-----------------|----------|
| `DATABASE_URL` | Supabase connection string (above) | ✅ |
| `CLERK_SECRET_KEY` | Clerk → API Keys → `sk_test_...` or `sk_live_...` | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → `pk_test_bWFqb3ItZHVjay05MS5jbGVyay5hY2NvdW50cy5kZXYk` | ✅ |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → endpoint `/api/webhooks/clerk` | Recommended |
| `CRON_SECRET` | Generate a random string (32+ chars) — Vercel cron auth for autopilot | ✅ |
| `ALLOW_DEV_AUTH` | `false` | ✅ |
| `NEXT_PUBLIC_ALLOW_DEV_AUTH` | `false` | ✅ |

**Webhook URL to add in Clerk:**

```
https://auxano-red.vercel.app/api/webhooks/clerk
```

Events: `user.created`

After saving env vars → **Deployments → Redeploy**

Verify:

```bash
npm run verify:deploy -- https://auxano-red.vercel.app
```

All three must pass: `live`, `ready`, `health`.

---

### 3. Clerk (authentication)

Dashboard: [dashboard.clerk.com](https://dashboard.clerk.com)

| Task | Done? |
|------|-------|
| **Disable** Apple sign-in | ☐ |
| **Disable** Google sign-in | ☐ |
| **Enable** Email + Password | ☐ |
| **Enable** email verification on sign-up | ☐ |
| Allowed origins: `https://auxano-red.vercel.app` | ☐ |
| Allowed origins: `auxano://` | ☐ |
| Webhook → Vercel URL with secret on Vercel | ☐ |

**Keys**

| Key | Goes where |
|-----|------------|
| Publishable `pk_test_...` | Vercel + EAS (already in `eas.json`) |
| Secret `sk_test_...` | **Vercel only** — never in mobile app |

When ready for public App Store (optional later): switch to `pk_live_` / `sk_live_`.

---

### 4. Expo / EAS (iOS builds)

| Field | Value in repo |
|-------|----------------|
| Expo account | `dhruvh` (logged in) |
| EAS project ID | `67a39614-b3cf-4ae9-bbea-c63496891ead` |
| Bundle ID | `app.auxano.mobile` |
| Apple Team ID | `D49RVY375B` |
| ASC App ID | `6776782489` |

Build commands:

```bash
cd apps/mobile
npm run build:ios:preview    # TestFlight candidate
npm run build:ios            # App Store production
npm run submit:ios           # Upload to App Store Connect
```

---

### 5. Apple — App Store Connect

Copy text from **`APP_STORE_METADATA.md`**.

| Item | Done? |
|------|-------|
| Upload 8 screenshots from `apps/mobile/app-store-screenshots/6.7-inch/` | ☐ |

Screenshot order for App Store Connect (6.7" display):

| # | File | Screen |
|---|------|--------|
| 1 | `01-sign-in.png` | Sign in |
| 2 | `02-dashboard.png` | Dashboard |
| 3 | `03-marketplace.png` | Marketplace |
| 4 | `04-trade.png` | Trade |
| 5 | `05-bots.png` | Bots / autopilot |
| 6 | `06-compete.png` | Compete |
| 7 | `07-strategy-detail.png` | Strategy detail |
| 8 | `08-profile-settings.png` | Settings |

| Item | Done? |
|------|-------|
| Subtitle: **Paper trading OS** | ☐ |
| Description + keywords | ☐ |
| Privacy Policy URL: `https://auxano-red.vercel.app/privacy` | ☐ |
| Terms URL: `https://auxano-red.vercel.app/terms` | ☐ |
| Privacy nutrition labels (email, user ID — no tracking) | ☐ |
| Export compliance: **No** (standard HTTPS only) | ☐ |
| Age rating questionnaire (Finance, 4+) | ☐ |
| Internal TestFlight tester (your Apple ID email) | ☐ |
| Submit for review | ☐ |

**Review notes for Apple** (paste in App Store Connect):

```
Auxano is a paper-trading simulator. No real money, brokerage, or live trading.
Sign in with email and password (Clerk). Create a test account in-app via Sign up.
All market data is simulated or delayed for education. Autopilot runs on our server.
```

---

## Part C — Launch order (do in this sequence)

```
Step 1  Supabase project Active → copy connection string
Step 2  npm run db:push && npm run db:seed
Step 3  Paste DATABASE_URL + Clerk keys into Vercel → Redeploy
Step 4  npm run verify:deploy -- https://auxano-red.vercel.app  (must pass)
Step 5  Clerk: disable OAuth, enable email, add webhook + origins
Step 6  npm run build:ios:preview → install on iPhone
Step 7  Smoke test (checklist below)
Step 8  Upload screenshots + metadata → App Store Connect
Step 9  npm run build:ios && npm run submit:ios
Step 10 Submit for review
```

---

## Part D — TestFlight smoke test (on real iPhone)

Use a **new email** (not `test@gmail.com` — that is dev-only).

- [ ] Sign up → receive verification code → land on onboarding
- [ ] Finish onboarding → land on Bots with a deployed preset
- [ ] Dashboard shows $100,000 paper balance
- [ ] Buy a stock on Trade tab
- [ ] Settings → Reset password link opens forgot-password flow
- [ ] Settings → Privacy / Terms open
- [ ] Settings → Sign out → Sign in again
- [ ] Close app 15+ minutes → reopen → bot has run (or push notification)

---

## Part E — Useful commands

| Command | Purpose |
|---------|---------|
| `npm run verify:production-ready` | Automated pre-flight |
| `npm run verify:deploy -- https://auxano-red.vercel.app` | Production API health |
| `npm run test:auth` | Local auth smoke tests |
| `npm run screenshots` | Regenerate App Store PNGs |
| `npm run mobile:build:ios` | EAS production iOS build |
| `npm run mobile:submit:ios` | Submit latest build to ASC |

---

## Part F — Security reminders

1. **Rotate** your Supabase database password if it was ever pasted in chat.
2. Never commit `.env`, `.env.local`, or `.env.production` with secrets.
3. `sk_*` Clerk secret stays on **Vercel only**.
4. Set `ALLOW_DEV_AUTH=false` on Vercel production.

---

## Part G — Optional v1.1 (not blocking review)

- Mobile strategy builder (publish on web today)
- Friends screen on mobile
- `pk_live_` / `sk_live_` Clerk for production scale
- Move API off Vercel (mobile only needs `EXPO_PUBLIC_API_URL` updated)

---

## Quick reference — architecture

```
iPhone (Auxano app)
    ↓ Clerk email/password login
    ↓ Bearer JWT on API calls
Vercel API (auxano-red.vercel.app)
    ↓ Prisma
Supabase Postgres
    ↑
Autopilot cron daily at 14:00 UTC (Hobby plan limit; upgrade Vercel for more frequent runs)
```

---

**Questions?** Run `npm run verify:production-ready` and fix any ✗ before building for TestFlight.
