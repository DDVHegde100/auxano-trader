import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import {
  listFriendSocial,
  sendFriendRequest,
  removeFriend,
} from "@/lib/services/friends";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const data = await listFriendSocial(user.id);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const username = body.username as string;
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }
    const row = await sendFriendRequest(user.id, username);
    return NextResponse.json({ request: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireDbUser(req);
    const url = new URL(req.url);
    const otherUserId = url.searchParams.get("userId");
    if (!otherUserId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    await removeFriend(user.id, otherUserId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 400 }
    );
  }
}
