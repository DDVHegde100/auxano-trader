#!/usr/bin/env node
/** Quick DB connectivity test — run: node scripts/test-db.mjs */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(rel) {
  const p = path.join(root, rel);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"]+)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnvFile("packages/database/.env");
loadEnvFile("apps/web/.env.local");

const urls = [
  process.env.DATABASE_URL,
  "postgresql://postgres:postgres@localhost:5433/auxano?schema=public",
  "postgresql://postgres:postgres@127.0.0.1:5433/auxano?schema=public",
  "postgresql://postgres:postgres@localhost:5432/auxano?schema=public",
].filter(Boolean);

for (const url of urls) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("OK:", url);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.log("FAIL:", url);
    console.log("     ", e.message?.split("\n")[0]);
    await prisma.$disconnect().catch(() => {});
  }
}
console.log("\nNo working database URL. Start Docker: npm run fix:db");
process.exit(1);
