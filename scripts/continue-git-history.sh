#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

commit() {
  local msg="$1"
  shift
  git add "$@" 2>/dev/null || true
  if git diff --cached --quiet; then
    echo "skip: $msg"
    return 0
  fi
  git commit -m "$msg"
  echo "✓ $msg"
}

commit "scaffold nextjs web app config" \
  apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts \
  apps/web/eslint.config.mjs apps/web/postcss.config.mjs \
  apps/web/.gitignore apps/web/public

git add -f apps/web/.env.example 2>/dev/null || true
git diff --cached --quiet || git commit -m "add web environment example file"

commit "add web global styles and ui primitives" \
  apps/web/src/app/globals.css apps/web/src/components/ui

commit "add web lib utils json and services" \
  apps/web/src/lib/utils.ts apps/web/src/lib/json.ts \
  apps/web/src/lib/services apps/web/src/lib/dev-session.ts \
  apps/web/src/lib/session.ts apps/web/src/stores

commit "add web auth session and middleware" \
  apps/web/src/lib/auth.ts apps/web/src/middleware.ts \
  apps/web/src/components/app-providers.tsx

commit "add web api health and market routes" \
  apps/web/src/app/api/health apps/web/src/app/api/market

commit "add web api trading and portfolio routes" \
  apps/web/src/app/api/trading apps/web/src/app/api/portfolio \
  apps/web/src/app/api/dashboard

commit "add web api strategies and algorithms" \
  apps/web/src/app/api/strategies apps/web/src/app/api/algorithms \
  apps/web/src/app/api/backtest apps/web/src/app/api/watchlist \
  apps/web/src/app/api/leaderboard apps/web/src/app/api/user

commit "add web api dev auth routes" apps/web/src/app/api/auth

commit "add web root layout and landing page" \
  apps/web/src/app/layout.tsx apps/web/src/app/page.tsx \
  apps/web/src/components/auxano/splash-screen.tsx

commit "add web sign in and onboarding flows" \
  apps/web/src/app/sign-in apps/web/src/app/sign-up apps/web/src/app/onboarding

commit "add web app shell and dashboard pages" \
  apps/web/src/app/\(app\)/layout.tsx apps/web/src/components/layout \
  apps/web/src/app/\(app\)/dashboard

commit "add web marketplace trade portfolio pages" \
  apps/web/src/app/\(app\)/marketplace apps/web/src/app/\(app\)/trade \
  apps/web/src/app/\(app\)/portfolio

commit "add web builder strategy and leaderboard" \
  apps/web/src/app/\(app\)/builder apps/web/src/app/\(app\)/strategies \
  apps/web/src/app/\(app\)/leaderboard apps/web/src/components/auxano

commit "scaffold expo mobile app config" \
  apps/mobile/package.json apps/mobile/tsconfig.json apps/mobile/app.json \
  apps/mobile/babel.config.js apps/mobile/metro.config.js apps/mobile/.gitignore \
  apps/mobile/expo-env.d.ts

git add -f apps/mobile/.env.example 2>/dev/null || true
git diff --cached --quiet || git commit -m "add mobile environment example file"

commit "add mobile theme auth and api layer" \
  apps/mobile/src/lib apps/mobile/src/context apps/mobile/src/hooks/useAuth.ts \
  apps/mobile/app/_layout.tsx apps/mobile/app/index.tsx apps/mobile/app/\(auth\)

commit "add mobile shared ui components" apps/mobile/src/components

commit "add mobile dashboard trade tabs" \
  apps/mobile/app/\(tabs\)/_layout.tsx apps/mobile/app/\(tabs\)/dashboard.tsx \
  apps/mobile/app/\(tabs\)/trade.tsx

commit "add mobile marketplace portfolio more tabs" \
  apps/mobile/app/\(tabs\)/marketplace.tsx apps/mobile/app/\(tabs\)/portfolio.tsx \
  apps/mobile/app/\(tabs\)/more.tsx

commit "add mobile strategy detail screen" \
  apps/mobile/app/strategy apps/mobile/app/onboarding.tsx \
  apps/mobile/src/hooks/useAuthenticatedFetch.ts apps/mobile/src/hooks/usePolling.ts

commit "add dev scripts and path helpers" \
  scripts/run-dev.sh scripts/fix-database.sh scripts/test-db.mjs scripts/lib \
  scripts/bootstrap-git-history.sh scripts/continue-git-history.sh

commit "add readme start and production docs" README.md START.md PRODUCTION.md

git add -f packages/database/.env.example 2>/dev/null || true
git diff --cached --quiet || git commit -m "add database environment example file"

git add -A
if ! git diff --cached --quiet; then
  git commit -m "add remaining project files and polish"
  echo "✓ add remaining project files and polish"
fi

echo "Total: $(git rev-list --count HEAD) commits"
