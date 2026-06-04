import { NextRequest, NextResponse } from "next/server";
import { runSystemHealth } from "@/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Deep health probe for ops, Vercel, EAS, and mobile startup.
 * GET /api/health
 * GET /api/health?verbose=1  — includes per-check details (default)
 * GET /api/health?market=0   — skip external market quote probe
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeMarket = searchParams.get("market") !== "0";

  const report = await runSystemHealth({ includeMarket });

  const httpStatus =
    report.status === "healthy"
      ? 200
      : report.status === "degraded"
        ? 200
        : 503;

  return NextResponse.json(report, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Auxano-Health": report.status,
    },
  });
}
