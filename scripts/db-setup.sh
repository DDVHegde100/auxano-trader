#!/usr/bin/env bash
# Full database setup: generate client, push schema, seed, verify.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f packages/database/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source packages/database/.env
  set +a
fi

echo "→ Prisma generate"
npm run db:generate

echo "→ Prisma db push"
npm run db:push

echo "→ Seed"
npm run db:seed

echo "→ Connectivity test"
node scripts/test-db.mjs

echo "✓ Database ready. Start web: npm run dev:web"
