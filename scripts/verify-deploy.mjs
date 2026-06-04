#!/usr/bin/env node
/**
 * Verify a deployed Auxano API (Vercel or local).
 * Usage: node scripts/verify-deploy.mjs https://your-app.vercel.app
 */
const base = (process.argv[2] ?? process.env.DEPLOY_URL ?? "").replace(/\/$/, "");

if (!base) {
  console.error("Usage: node scripts/verify-deploy.mjs <base-url>");
  process.exit(1);
}

async function probe(path, label) {
  const url = `${base}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await res.json();
    const ms = Date.now() - start;
    const ok = res.ok;
    console.log(`${ok ? "✓" : "✗"} ${label} ${res.status} (${ms}ms) ${url}`);
    if (!ok) console.log("  ", JSON.stringify(body, null, 2).slice(0, 500));
    return { ok, body, status: res.status };
  } catch (e) {
    console.log(`✗ ${label} ERROR ${url}`);
    console.log("  ", e.message);
    return { ok: false };
  }
}

console.log(`\nAuxano deploy check → ${base}\n`);

const live = await probe("/api/live", "live");
const ready = await probe("/api/ready", "ready");
const health = await probe("/api/health", "health");

if (health.ok && health.body?.mobile?.apiBaseUrl) {
  console.log(`\nMobile API URL: ${health.body.mobile.apiBaseUrl}`);
}

const allOk = live.ok && ready.ok && health.ok;
console.log(allOk ? "\n✓ Deployment looks healthy\n" : "\n✗ Fix failing checks before shipping mobile\n");
process.exit(allOk ? 0 : 1);
