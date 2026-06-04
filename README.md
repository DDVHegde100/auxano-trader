# Auxano

**Auxano** (Greek: "to grow") — An Algorithmic Investment Operating System for paper trading, strategy building, and quantitative growth.

## Stack

| Layer | Technology |
|-------|------------|
| Mobile (iPhone-first) | Expo SDK 52, Expo Router, React Native |
| Web | Next.js 15, TypeScript, Tailwind, shadcn/ui |
| State | Zustand |
| Animation | Framer Motion (web), Reanimated (mobile) |
| Auth | Clerk (Google, GitHub, Email, Magic Link) |
| Database | PostgreSQL + Prisma |

## Monorepo

```
apps/
  web/      — Next.js app + API routes
  mobile/   — Expo app (primary mobile UX)
packages/
  database/ — Prisma schema & client
  shared/   — Types, constants, engines
  ui/       — Shared design tokens
```

## Quick Start (easiest)

```bash
npm run start
```

Then open **Expo Go** on iPhone and sign in with **test@gmail.com** / **Test1234!**

See [START.md](./START.md) for details.

## Quick Start (manual)

### 1. Environment

Copy env templates and fill in Clerk + database credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

### 2. Database

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

### 3. Web

```bash
npm run dev:web
# http://localhost:3000
```

### 4. Mobile (Expo)

```bash
npm run dev:mobile
# Scan QR with Expo Go on iPhone
# Set EXPO_PUBLIC_API_URL to your machine IP for device testing
```

## Paper Trading

Every user receives **$100,000** virtual cash on signup. No real-money trading in v1.

## License

Proprietary — Auxano © 2026
