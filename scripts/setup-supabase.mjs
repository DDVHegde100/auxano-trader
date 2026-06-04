#!/usr/bin/env node
/**
 * Probes Supabase connection strings (direct + pooler regions).
 * On success, writes packages/database/.env and apps/web/.env.local DATABASE_URL.
 *
 * Usage: node scripts/setup-supabase.mjs [password]
 * Or set SUPABASE_PASSWORD in env.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "oaupmyhtwcnilmmsleyu";

function encodePassword(pw) {
  return encodeURIComponent(pw);
}

function buildCandidates(password) {
  const enc = encodePassword(password);
  const regions = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "eu-west-1",
    "eu-central-1",
    "ap-southeast-1",
  ];
  const list = [
    `postgresql://postgres:${enc}@db.${projectRef}.supabase.co:5432/postgres?schema=public&sslmode=require`,
  ];
  for (const r of regions) {
    list.push(
      `postgresql://postgres.${projectRef}:${enc}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public&sslmode=require`
    );
    list.push(
      `postgresql://postgres.${projectRef}:${enc}@aws-1-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public&sslmode=require`
    );
    list.push(
      `postgresql://postgres.${projectRef}:${enc}@aws-0-${r}.pooler.supabase.com:5432/postgres?schema=public&sslmode=require`
    );
  }
  return list;
}

async function tryUrl(url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function patchEnvFile(filePath, databaseUrl) {
  if (!existsSync(filePath)) return;
  let content = readFileSync(filePath, "utf8");
  const line = `DATABASE_URL="${databaseUrl}"`;
  if (/^DATABASE_URL=/m.test(content)) {
    content = content.replace(/^DATABASE_URL=.*$/m, line);
  } else {
    content = `${line}\n${content}`;
  }
  writeFileSync(filePath, content);
  console.log("Updated", filePath);
}

const password =
  process.argv[2] ??
  process.env.SUPABASE_PASSWORD ??
  process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error(
    "Usage: node scripts/setup-supabase.mjs <database-password>\nOr set SUPABASE_PASSWORD."
  );
  process.exit(1);
}

console.log(`Probing Supabase project ${projectRef}…`);
let winner = null;
for (const url of buildCandidates(password)) {
  const host = url.split("@")[1]?.split("/")[0] ?? url;
  process.stdout.write(`  ${host} … `);
  if (await tryUrl(url)) {
    console.log("OK");
    winner = url;
    break;
  }
  console.log("fail");
}

if (!winner) {
  console.error(
    "\nNo Supabase host responded. In dashboard: Settings → Database → copy URI.\n" +
      "Ensure project is not paused. Then set DATABASE_URL manually and run: npm run db:push"
  );
  process.exit(1);
}

patchEnvFile(path.join(root, "packages/database/.env"), winner);
patchEnvFile(path.join(root, "apps/web/.env.local"), winner);
console.log("\nConnected. Run: npm run db:push && npm run db:seed");
