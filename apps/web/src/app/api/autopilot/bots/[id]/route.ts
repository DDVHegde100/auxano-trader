import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import {
  getBotDetail,
  updateBotSettings,
} from "@/lib/services/autopilot";

export async function GET(
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
    return NextResponse.json({ bot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { id } = await params;
    const body = await req.json();
    await updateBotSettings(id, user.id, body);
    const bot = await getBotDetail(id, user.id);
    return NextResponse.json({ bot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
