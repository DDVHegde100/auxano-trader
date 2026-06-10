import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { getBotDetail, runDeploymentAutopilot } from "@/lib/services/autopilot";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { id } = await params;
    const bot = await getBotDetail(id, user.id);
    if (!bot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const result = await runDeploymentAutopilot(id);
    const updated = await getBotDetail(id, user.id);
    return NextResponse.json({ result, bot: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
