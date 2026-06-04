import { checkDatabaseConnection } from "@/lib/db-health";
import { checkClerkConnection } from "./clerk-check";
import { checkEnvironment } from "./env-check";
import { checkMarketData } from "./market-check";
import type { HealthCheckResult, SystemHealthReport } from "./types";

const STARTED_AT = Date.now();
const VERSION = process.env.npm_package_version ?? "1.0.0";

function dbToCheck(db: Awaited<ReturnType<typeof checkDatabaseConnection>>): HealthCheckResult {
  return {
    id: "database",
    name: "PostgreSQL (Prisma)",
    status: db.ok ? "pass" : "fail",
    latencyMs: db.latencyMs,
    message: db.ok ? "Connected" : db.error,
    details: db.ok
      ? { provider: "postgresql" }
      : undefined,
  };
}

function aggregateStatus(checks: HealthCheckResult[]): SystemHealthReport["status"] {
  if (checks.some((c) => c.status === "fail")) return "unhealthy";
  if (checks.some((c) => c.status === "warn")) return "degraded";
  return "healthy";
}

export function getPublicApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function runSystemHealth(options?: {
  includeMarket?: boolean;
}): Promise<SystemHealthReport> {
  const envCheck = checkEnvironment();
  const [dbRaw, clerk, market] = await Promise.all([
    checkDatabaseConnection(),
    checkClerkConnection(),
    options?.includeMarket !== false ? checkMarketData() : null,
  ]);

  const checks: HealthCheckResult[] = [
    envCheck,
    dbToCheck(dbRaw),
    clerk,
  ];
  if (market) checks.push(market);

  const summary = {
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };

  return {
    status: aggregateStatus(checks),
    service: "auxano-trader",
    version: VERSION,
    environment:
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",
    region: process.env.VERCEL_REGION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    checks,
    summary,
    mobile: {
      apiBaseUrl: getPublicApiBaseUrl(),
      corsEnabled: true,
    },
  };
}

export function isReadyForTraffic(report: SystemHealthReport): boolean {
  const critical = ["environment", "database", "clerk"];
  return critical.every((id) => {
    const c = report.checks.find((x) => x.id === id);
    return c?.status === "pass";
  });
}
