#!/usr/bin/env node
/**
 * Pre-flight checklist before TestFlight / App Store.
 * Usage: node scripts/verify-production-ready.mjs [api-base-url]
 */
const apiBase = (process.argv[2] ?? "https://auxano-red.vercel.app").replace(/\/$/, "");

const codeChecks = [
  {
    id: "screenshots",
    label: "6.7\" App Store screenshots",
    ok: async () => {
      const { access } = await import("fs/promises");
      const { join, dirname } = await import("path");
      const { fileURLToPath } = await import("url");
      const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "apps/mobile/app-store-screenshots/6.7-inch");
      await access(join(dir, "02-dashboard.png"));
      return `Found in apps/mobile/app-store-screenshots/6.7-inch/`;
    },
  },
  {
    id: "eas-config",
    label: "EAS bundle + Clerk key in eas.json",
    ok: async () => {
      const { readFile } = await import("fs/promises");
      const { join, dirname } = await import("path");
      const { fileURLToPath } = await import("url");
      const p = join(dirname(fileURLToPath(import.meta.url)), "..", "apps/mobile/eas.json");
      const json = JSON.parse(await readFile(p, "utf8"));
      const prod = json.build?.production?.env ?? {};
      if (!prod.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_")) {
        throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in eas.json production env");
      }
      if (prod.EXPO_PUBLIC_USE_DEV_AUTH === "true") {
        throw new Error("EXPO_PUBLIC_USE_DEV_AUTH must be false for production");
      }
      return "eas.json production env looks configured";
    },
  },
  {
    id: "mobile-settings",
    label: "Mobile Settings screen",
    ok: async () => {
      const { access } = await import("fs/promises");
      const { join, dirname } = await import("path");
      const { fileURLToPath } = await import("url");
      await access(join(dirname(fileURLToPath(import.meta.url)), "..", "apps/mobile/app/settings.tsx"));
      return "apps/mobile/app/settings.tsx exists";
    },
  },
];

async function probeApi() {
  const checks = [];
  for (const path of ["/api/live", "/api/ready", "/api/health"]) {
    try {
      const res = await fetch(`${apiBase}${path}`, { headers: { Accept: "application/json" } });
      const body = await res.json().catch(() => ({}));
      const dbOk = body?.checks?.find?.((c) => c.id === "database")?.status === "pass";
      checks.push({
        path,
        ok: res.ok && (path === "/api/live" || dbOk || body.ready === true || body.status === "healthy"),
        status: res.status,
        detail: body?.checks?.find?.((c) => c.id === "database")?.message?.slice?.(0, 80) ?? body.status,
      });
    } catch (e) {
      checks.push({ path, ok: false, status: 0, detail: e.message });
    }
  }
  return checks;
}

console.log(`\nAuxano production readiness → ${apiBase}\n`);

let failed = 0;

for (const check of codeChecks) {
  try {
    const detail = await check.ok();
    console.log(`✓ [code] ${check.label} — ${detail}`);
  } catch (e) {
    failed++;
    console.log(`✗ [code] ${check.label} — ${e.message}`);
  }
}

const apiChecks = await probeApi();
for (const c of apiChecks) {
  if (c.ok) console.log(`✓ [api] ${c.path} ${c.status}`);
  else {
    failed++;
    console.log(`✗ [api] ${c.path} ${c.status} — ${c.detail ?? "failed"}`);
  }
}

console.log(`
Manual steps (see PRODUCTION_LAUNCH.md):
  • Vercel DATABASE_URL → your Supabase connection string
  • Vercel CLERK_SECRET_KEY + CLERK_WEBHOOK_SECRET
  • Clerk dashboard: disable Apple/Google OAuth
  • App Store Connect: upload screenshots + metadata
  • npm run mobile:build:ios → TestFlight smoke test
`);

console.log(failed ? `\n✗ ${failed} automated check(s) failed\n` : `\n✓ All automated checks passed\n`);
process.exit(failed > 0 ? 1 : 0);
