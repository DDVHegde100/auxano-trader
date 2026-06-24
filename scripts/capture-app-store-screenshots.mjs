#!/usr/bin/env node
/**
 * Capture App Store screenshots via headless browser.
 * Uses local web app + dev login when ALLOW_DEV_AUTH=true.
 *
 * Usage:
 *   node scripts/capture-app-store-screenshots.mjs [base-url] [--6.5|--6.7]
 *
 * Requires: npx playwright install chromium (first run)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sizeFlag = args.find((a) => a === "--6.5" || a === "--6.7") ?? "--6.7";
const base = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const PRESETS = {
  "--6.7": {
    label: '6.7"',
    folder: "6.7-inch",
    pixels: "1290×2796",
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
  },
  "--6.5": {
    label: '6.5"',
    folder: "6.5-inch",
    pixels: "1284×2778",
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
  },
};

const preset = PRESETS[sizeFlag] ?? PRESETS["--6.7"];
const outDir = path.join(root, "apps/mobile/app-store-screenshots", preset.folder);

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
    viewport: preset.viewport,
    deviceScaleFactor: preset.deviceScaleFactor,
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
      await page.screenshot({ path: path.join(outDir, `${shot.name}.png`) });
      console.log(`✓ ${shot.name}.png`);
    }

    const readme = `# App Store screenshots (${preset.label} — ${preset.pixels})

Generated from ${base} on ${new Date().toISOString().split("T")[0]}.

Upload to App Store Connect → Auxano → iOS App → Screenshots → ${preset.label} Display.

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
