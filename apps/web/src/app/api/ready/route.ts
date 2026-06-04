import { NextResponse } from "next/server";
import { isReadyForTraffic, runSystemHealth } from "@/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Readiness probe — returns 200 only when DB + Clerk + env are OK.
 * Use for Vercel, load balancers, and EAS preflight.
 */
export async function GET() {
  const report = await runSystemHealth({ includeMarket: false });
  const ready = isReadyForTraffic(report);

  return NextResponse.json(
    {
      ready,
      status: report.status,
      timestamp: report.timestamp,
      checks: report.checks
        .filter((c) => ["environment", "database", "clerk"].includes(c.id))
        .map((c) => ({
          id: c.id,
          status: c.status,
          message: c.message,
          latencyMs: c.latencyMs,
        })),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
