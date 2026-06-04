import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { respondToFriendRequest } from "@/lib/services/friends";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { id } = await params;
    const body = await req.json();
    const action = body.action as "accept" | "reject";
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const row = await respondToFriendRequest(user.id, id, action);
    return NextResponse.json({ request: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 400 }
    );
  }
}
