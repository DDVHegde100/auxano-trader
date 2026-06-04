import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { updateNotificationPrefs } from "@/lib/services/notifications";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const token =
      typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "expoPushToken required" }, { status: 400 });
    }

    const prefs = await updateNotificationPrefs(user.id, {
      expoPushToken: token,
      pushEnabled: body.pushEnabled !== false,
    });

    return NextResponse.json({ ok: true, prefs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireDbUser(req);
    const prefs = await updateNotificationPrefs(user.id, {
      expoPushToken: null,
    });
    return NextResponse.json({ ok: true, prefs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
