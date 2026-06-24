#!/usr/bin/env node
/**
 * Set required Vercel production env vars from local gitignored files.
 * Usage: node scripts/set-vercel-production-env.mjs
 * Run from repo root; requires `vercel link` in apps/web.
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "apps/web");

function parseEnvFile(rel) {
  const p = path.join(root, rel);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]+)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const dbEnv = parseEnvFile("packages/database/.env");
const localEnv = parseEnvFile("apps/web/.env.local");
const easJson = existsSync(path.join(root, "apps/mobile/eas.json"))
  ? JSON.parse(readFileSync(path.join(root, "apps/mobile/eas.json"), "utf8"))
  : {};
const easClerk =
  easJson.build?.production?.env?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  easJson.build?.preview?.env?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const vars = {
  DATABASE_URL: dbEnv.DATABASE_URL,
  CLERK_SECRET_KEY: localEnv.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    localEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? easClerk,
  NEXT_PUBLIC_APP_URL: "https://auxano-red.vercel.app",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/dashboard",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/onboarding",
  ALLOW_DEV_AUTH: "false",
  NEXT_PUBLIC_ALLOW_DEV_AUTH: "false",
  ALLOWED_ORIGINS: "*",
  CRON_SECRET: randomBytes(32).toString("hex"),
};

const missing = Object.entries(vars).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error("Missing values for:", missing.join(", "));
  process.exit(1);
}

function addEnv(name, value) {
  const rm = spawnSync("vercel", ["env", "rm", name, "production", "--yes"], {
    cwd: webDir,
    stdio: "pipe",
  });
  void rm;
  const add = spawnSync("vercel", ["env", "add", name, "production"], {
    cwd: webDir,
    input: value,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (add.status !== 0) {
    console.error(`Failed ${name}:`, add.stderr?.toString() || add.stdout?.toString());
    process.exit(1);
  }
  console.log(`✓ ${name}`);
}

console.log("\nSetting Vercel production env (linked project in apps/web/.vercel)…\n");
for (const [name, value] of Object.entries(vars)) {
  addEnv(name, value);
}
console.log("\nDone. Redeploy with: cd apps/web && vercel deploy --prod\n");
