import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  ensureNotificationPrefs,
} from "@/lib/services/notifications";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    await ensureNotificationPrefs(user.id);
    const prefs = await getNotificationPrefs(user.id);
    return NextResponse.json({ prefs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const prefs = await updateNotificationPrefs(user.id, body);
    return NextResponse.json({ prefs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
