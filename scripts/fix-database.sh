#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PG_BIN="/opt/homebrew/opt/postgresql@15/bin"
[ -x "$PG_BIN/psql" ] || PG_BIN="/usr/local/opt/postgresql@15/bin"
export PATH="$PG_BIN:$PATH"
USER="${USER:-$(whoami)}"
export DATABASE_URL="postgresql://${USER}@localhost:5432/auxano?schema=public"

echo "→ Homebrew Postgres, database auxano, user ${USER}"
psql -d postgres -c "CREATE DATABASE auxano;" 2>/dev/null || true
echo "DATABASE_URL=\"${DATABASE_URL}\"" > packages/database/.env
npm run db:generate && npm run db:push && npm run db:seed
node scripts/test-db.mjs && echo "✓ Database OK — run: npm run start"
