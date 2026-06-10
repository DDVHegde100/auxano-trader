import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { createHeadToHeadDuel } from "@/lib/services/competitions";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const duel = await createHeadToHeadDuel({
      creatorId: user.id,
      opponentUsername: body.opponentUsername,
      durationDays: body.durationDays,
      message: body.message,
      title: body.title,
    });
    return NextResponse.json({ duel });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 400 }
    );
  }
}
