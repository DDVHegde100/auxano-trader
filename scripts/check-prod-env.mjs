#!/usr/bin/env node
/**
 * Fails CI/production deploy if dev auth is enabled.
 * Usage: NODE_ENV=production node scripts/check-prod-env.mjs
 */
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.CI === "true";

if (!isProd) {
  console.log("check-prod-env: skipped (not production/CI)");
  process.exit(0);
}

const bad = [];
if (process.env.ALLOW_DEV_AUTH === "true") bad.push("ALLOW_DEV_AUTH=true");
if (process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true") {
  bad.push("NEXT_PUBLIC_ALLOW_DEV_AUTH=true");
}

if (bad.length) {
  console.error("Production env check failed:");
  bad.forEach((b) => console.error(`  - ${b}`));
  process.exit(1);
}

console.log("check-prod-env: OK");
