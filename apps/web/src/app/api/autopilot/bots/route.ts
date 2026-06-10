import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { listUserBots } from "@/lib/services/autopilot";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const bots = await listUserBots(user.id);
    return NextResponse.json({ bots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
