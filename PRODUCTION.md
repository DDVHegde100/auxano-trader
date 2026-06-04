# Auxano Trader — Production Readiness

## Current state (~55% production-ready)

| Area | Status | Notes |
|------|--------|-------|
| **Core product** | Strong | Paper trading, presets, backtest, marketplace, mobile tabs |
| **API layer** | Good | Next.js routes, Prisma, shared engines |
| **Auth** | Dev-ready | Clerk + dev bypass; production needs real Clerk **or** Firebase Auth |
| **Database** | Good | PostgreSQL + Prisma; needs managed DB (Neon/RDS) + migrations |
| **Security** | Partial | Dev tokens must be disabled in prod; secrets via env/Vault |
| **Observability** | Missing | No Sentry, structured logs, or health dashboards |
| **CI/CD** | Missing | No GitHub Actions, preview deploys, or EAS builds |
| **Compliance** | Partial | Paper-only disclaimers; need ToS/privacy before public launch |
| **Styling** | Good | Dark luxury glass UI; polish pass on web + mobile parity |
| **Scale** | Early | Simulated market data; no real broker or live feeds |

**Verdict:** Excellent **local demo / beta**. Not production until auth, DB hosting, CI, monitoring, and dev-auth removal are done.

---

## Firebase vs current stack

Auxano today uses **Clerk** (auth) + **PostgreSQL/Prisma** (data). Firebase is optional unless you **migrate auth** or add mobile services.

### Recommended Firebase setup (hybrid)

Create project: **Auxano Trader** (or `auxano-trader`).

#### 1. Project settings (console)

- **General:** Register **Web** app (`auxano-web`) and **iOS** app (`auxano-ios`) if using native builds later.
- **Analytics:** Enable Google Analytics for Firebase (optional v1).
- **App Check:** Enable for Web + iOS when you expose public APIs (after launch).

#### 2. Authentication (if replacing Clerk)

Enable sign-in providers:

| Provider | Enable | Notes |
|----------|--------|-------|
| Email/Password | Yes | Matches test flow; add email verification in prod |
| Google | Yes | Primary OAuth |
| Apple | Yes | Required for App Store if you ship native iOS |
| Anonymous | No | Paper trading needs identifiable users |

Settings:

- **Authorized domains:** `localhost`, your Vercel domain, custom domain.
- **Email enumeration protection:** On.
- **Multi-factor:** Optional for v2.

**Migration work:** Replace Clerk middleware with Firebase Admin SDK session cookies on web; `@react-native-firebase/auth` or Expo Firebase on mobile; map `firebaseUid` → Prisma `User` (replace `clerkId` column or add `firebaseUid`).

#### 3. Do **not** use Firestore as primary DB (yet)

Keep **PostgreSQL** for portfolios, orders, strategies. Firestore duplicates Prisma and complicates transactions.

Use Firebase only for: Auth, FCM push, Remote Config, Crashlytics.

#### 4. Cloud Messaging (FCM)

- Enable **Firebase Cloud Messaging**.
- Upload APNs key when you ship iOS native (Expo uses FCM → APNs).
- Use for: price alerts, strategy signals, leaderboard updates.

#### 5. Hosting (optional)

- **Firebase Hosting:** Static marketing site only, **or** skip and use Vercel for Next.js 15.
- **Recommended:** Vercel for `apps/web`, EAS for `apps/mobile`.

#### 6. Crashlytics + Performance

- Enable **Crashlytics** on mobile (EAS build).
- **Performance Monitoring** on web (lightweight).

#### 7. Remote Config

- Feature flags: `enable_live_market`, `max_preset_deploys`, maintenance mode.

#### 8. Service accounts & env

Download service account JSON → store in CI secrets only (never commit).

```bash
# Web (if using Firebase Admin)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

#### 9. Security rules

- **Firestore:** deny all if unused (`allow read, write: if false`).
- **Storage:** deny until you add avatar uploads.

#### 10. Billing

- Blaze plan required for Cloud Functions (if you add webhooks later).
- Set budget alerts ($25 / $50 / $100).

---

## Today's 20-commit plan (production path)

Each commit = one focused change, lowercase message (~5–6 words).

| # | Commit focus | Message example |
|---|----------------|-----------------|
| 1 | Remove dev auth from prod builds | `gate dev auth behind env flag` |
| 2 | Add Prisma migrations (replace db push) | `add initial prisma migration baseline` |
| 3 | Neon/RDS connection + SSL | `configure production database url ssl` |
| 4 | Clerk production keys + middleware | `wire clerk production auth flow` |
| 5 | Firebase Auth spike (optional branch) | `add firebase admin session verify` |
| 6 | Rate limiting on API routes | `add rate limits to trading apis` |
| 7 | Input validation (zod) on all POST | `validate api request bodies with zod` |
| 8 | Structured logging (pino) | `add structured logging for api routes` |
| 9 | Sentry web + mobile | `integrate sentry error reporting` |
| 10 | Health + readiness probes | `add readiness check for database` |
| 11 | GitHub Actions: lint + typecheck | `add ci workflow for typecheck lint` |
| 12 | GitHub Actions: Prisma migrate deploy | `add ci database migrate on deploy` |
| 13 | Vercel preview + production env | `document vercel env and deploy` |
| 14 | EAS build profiles (iOS) | `add eas build profiles for ios` |
| 15 | Real market data adapter interface | `abstract market data provider interface` |
| 16 | CSP + security headers | `add security headers middleware` |
| 17 | Privacy policy + paper disclaimer | `add legal pages and disclaimers` |
| 18 | E2E smoke (Playwright) sign-in flow | `add playwright smoke for dashboard` |
| 19 | Load test paper trading endpoints | `add k6 script for order endpoint` |
| 20 | Release tag + changelog v1.0.0 | `release v1.0.0 production checklist` |

---

## Run locally (web — browse full app)

```bash
cd auxano_sims
npm run fix:db          # postgres + migrate + seed
npm run dev:web         # http://localhost:3000
```

Sign in: **test@gmail.com** / **Test1234!** → `/dashboard`

Or one shot: `npm run start` (API + Expo QR).

---

## GitHub

Private repo: **Auxano Trader** → `auxano-trader` (slug). Initial history: 32 commits via `npm run git:bootstrap`.
