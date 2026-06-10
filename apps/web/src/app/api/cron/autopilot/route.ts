import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { runAutopilotCron } from "@/lib/services/autopilot";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    assertCronAuthorized(req);
    const result = await runAutopilotCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cron failed";
    const status = msg.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
