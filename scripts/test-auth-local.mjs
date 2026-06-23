#!/usr/bin/env node
/**
 * Local auth smoke tests — dev login, token auth, logout.
 * Usage: node scripts/test-auth-local.mjs [base-url] [rounds]
 */
const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const rounds = Math.max(1, parseInt(process.argv[3] ?? "3", 10));

const EMAIL = "test@gmail.com";
const PASSWORD = "Test1234!";

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`  ✓ ${label}`);
}

function fail(label, detail = "") {
  failed++;
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

async function runRound(n) {
  console.log(`\n── Round ${n}/${rounds} ──`);

  // Health
  try {
    const health = await fetch(`${base}/api/health`);
    const body = await health.json().catch(() => ({}));
    if (health.ok || body?.checks?.some((c) => c.id === "database" && c.status === "pass")) {
      ok("GET /api/health (API reachable)");
    } else {
      fail("GET /api/health", String(health.status));
    }
  } catch (e) {
    fail("GET /api/health", e.message);
    return;
  }

  // Bad password
  const badRes = await fetch(`${base}/api/auth/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: "wrong" }),
  });
  if (badRes.status === 401) ok("POST dev-login rejects bad password");
  else fail("POST dev-login rejects bad password", String(badRes.status));

  // Good login
  const loginRes = await fetch(`${base}/api/auth/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginBody.token) {
    fail("POST dev-login succeeds", JSON.stringify(loginBody).slice(0, 120));
    return;
  }
  ok("POST dev-login returns token");

  const token = loginBody.token;

  // Protected route with Bearer
  const dashRes = await fetch(`${base}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (dashRes.ok) ok("GET /api/dashboard with Bearer token");
  else fail("GET /api/dashboard with Bearer token", String(dashRes.status));

  // Profile
  const profileRes = await fetch(`${base}/api/user/profile`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (profileRes.ok) ok("GET /api/user/profile with Bearer token");
  else fail("GET /api/user/profile with Bearer token", String(profileRes.status));

  // Onboarding status
  const onboardRes = await fetch(`${base}/api/user/onboarding`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (onboardRes.ok) ok("GET /api/user/onboarding with Bearer token");
  else fail("GET /api/user/onboarding with Bearer token", String(onboardRes.status));

  // Unauthenticated rejected
  const noAuth = await fetch(`${base}/api/dashboard`);
  if (noAuth.status === 401 || noAuth.status === 403) ok("GET /api/dashboard without token rejected");
  else fail("GET /api/dashboard without token rejected", String(noAuth.status));

  // Logout
  const logoutRes = await fetch(`${base}/api/auth/dev-logout`, {
    method: "POST",
    headers: { Cookie: loginRes.headers.get("set-cookie") ?? "" },
  });
  if (logoutRes.ok) ok("POST dev-logout");
  else fail("POST dev-logout", String(logoutRes.status));
}

console.log(`\nAuxano auth smoke tests → ${base} (${rounds} rounds)\n`);

for (let i = 1; i <= rounds; i++) {
  await runRound(i);
}

console.log(`\n${"═".repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Rounds: ${rounds}`);
console.log(`${"═".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
