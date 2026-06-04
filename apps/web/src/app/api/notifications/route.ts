import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/services/notifications";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "1";
    const category = url.searchParams.get("category") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "50");

    const data = await listNotifications(user.id, {
      unreadOnly,
      category,
      limit: Math.min(limit, 100),
    });
    return NextResponse.json(data);
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
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : undefined;
    const data = await markNotificationsRead(user.id, ids);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
