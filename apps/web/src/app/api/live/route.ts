import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe — process is up (no dependency checks).
 */
export async function GET() {
  return NextResponse.json(
    { alive: true, service: "auxano-trader" },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
