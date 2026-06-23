#!/usr/bin/env node
/**
 * Capture 6.7" App Store screenshots (1290×2796) via headless browser.
 * Uses local web app + dev login when ALLOW_DEV_AUTH=true.
 *
 * Usage:
 *   node scripts/capture-app-store-screenshots.mjs [base-url]
 *
 * Requires: npx playwright install chromium (first run)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps/mobile/app-store-screenshots/6.7-inch");
const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");

/** iPhone 16 Pro Max logical size × 3 = 1290×2796 */
const VIEWPORT = { width: 430, height: 932 };
const DEVICE_SCALE = 3;

const shots = [
  { name: "01-sign-in", path: "/sign-in", auth: false },
  { name: "02-dashboard", path: "/dashboard", auth: true },
  { name: "03-marketplace", path: "/marketplace", auth: true },
  { name: "04-trade", path: "/trade", auth: true },
  { name: "05-bots", path: "/bots", auth: true },
  { name: "06-compete", path: "/compete", auth: true },
  { name: "07-strategy-detail", path: "/strategies/golden-cross-momentum", auth: true },
  { name: "08-profile-settings", path: "/profile", auth: true },
];

async function devLogin(page) {
  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  const email = page.locator('input[type="email"]');
  if ((await email.count()) === 0) {
    throw new Error(
      "Dev sign-in form not found. Start API with ALLOW_DEV_AUTH=true or use logged-in session."
    );
  }
  await email.fill("test@gmail.com");
  await page.locator('input[type="password"]').fill("Test1234!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 30000 });
}

async function capture(page, { name, path: route, auth }) {
  if (auth) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  } else {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  }
  await page.waitForTimeout(1200);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ ${name}.png`);
  return file;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const health = await fetch(`${base}/api/health`).catch(() => null);
  if (!health?.ok) {
    console.error(`API not reachable at ${base}. Start: cd apps/web && npm run dev:clean`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 14 Pro Max"],
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    colorScheme: "dark",
  });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, "01-sign-in.png") });
    console.log("✓ 01-sign-in.png");

    await devLogin(page);

    for (const shot of shots.filter((s) => s.auth)) {
      await page.goto(`${base}${shot.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(outDir, `${shot.name}.png`),
      });
      console.log(`✓ ${shot.name}.png`);
    }

    const readme = `# App Store screenshots (6.7" — 1290×2796)

Generated from ${base} on ${new Date().toISOString().split("T")[0]}.

Upload to App Store Connect → Auxano → iOS App → Screenshots → 6.7" Display.

| File | Screen |
|------|--------|
${shots.map((s) => `| ${s.name}.png | ${s.path} |`).join("\n")}
`;
    await writeFile(path.join(outDir, "README.md"), readme);
    console.log(`\nSaved ${shots.length} PNGs → ${outDir}\n`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
