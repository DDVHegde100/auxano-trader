#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source "$ROOT/scripts/lib/paths.sh"

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"
API_URL="http://${LAN_IP}:3000"

echo "══════════════════════════════════════════"
echo "  Auxano — starting"
echo "  Login: test@gmail.com / Test1234!"
echo "══════════════════════════════════════════"
echo "  API: ${API_URL}"
echo ""

# ── Database: Homebrew Postgres (port 5432) or Docker (5433) ──
setup_homebrew_db() {
  local PG_BIN="/opt/homebrew/opt/postgresql@15/bin"
  [ -d "$PG_BIN" ] || PG_BIN="/usr/local/opt/postgresql@15/bin"
  [ -x "$PG_BIN/psql" ] || return 1

  export PATH="$PG_BIN:$PATH"
  local USER="${USER:-$(whoami)}"
  export DATABASE_URL="postgresql://${USER}@localhost:5432/auxano?schema=public"

  pg_isready -q 2>/dev/null || return 1
  psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='auxano'" | grep -q 1 \
    || psql -d postgres -c "CREATE DATABASE auxano;" 2>/dev/null || true

  echo "→ Using Homebrew PostgreSQL on port 5432 (user: ${USER})"
  return 0
}

setup_docker_db() {
  local DB_PORT="${AUXANO_DB_PORT:-5433}"
  export DATABASE_URL="postgresql://postgres:postgres@localhost:${DB_PORT}/auxano?schema=public"
  docker_cmd info >/dev/null 2>&1 || return 1
  compose_cmd up -d postgres
  for i in $(seq 1 45); do
    compose_cmd exec -T postgres pg_isready -U postgres -d auxano >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

if setup_homebrew_db; then
  :
elif setup_docker_db; then
  echo "→ Using Docker PostgreSQL"
else
  echo "❌ No database found."
  echo "   Start Homebrew Postgres: brew services start postgresql@15"
  echo "   Or install Docker Desktop and run again."
  exit 1
fi

echo "DATABASE_URL=\"${DATABASE_URL}\"" > packages/database/.env
cat > apps/web/.env.local <<EOF
DATABASE_URL="${DATABASE_URL}"
ALLOW_DEV_AUTH=true
NEXT_PUBLIC_ALLOW_DEV_AUTH=true
DEV_AUTH_SECRET=auxano-local-dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_local
CLERK_SECRET_KEY=sk_test_local
EOF
cat > apps/mobile/.env <<EOF
EXPO_PUBLIC_USE_DEV_AUTH=true
EXPO_PUBLIC_API_URL=${API_URL}
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_local
EOF

[ ! -d node_modules ] && npm install --legacy-peer-deps

npm run db:generate
npm run db:push
npm run db:seed 2>/dev/null || npm run seed --workspace=@auxano/database

echo "→ API on http://localhost:3000 …"
npm run dev:web &
WEB_PID=$!
trap 'kill $WEB_PID 2>/dev/null; exit' INT TERM

for i in $(seq 1 45); do
  curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1 && break
  sleep 1
done
echo "  API ready ✓"
curl -sf http://127.0.0.1:3000/api/health && echo ""

echo ""
echo "→ Expo (scan QR with Expo Go)…"
cd "$ROOT/apps/mobile"
exec npx expo start --clear --lan
