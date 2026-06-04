import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { searchUsers } from "@/lib/services/friends";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const results = await searchUsers(q, user.id);
    return NextResponse.json({ users: results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
