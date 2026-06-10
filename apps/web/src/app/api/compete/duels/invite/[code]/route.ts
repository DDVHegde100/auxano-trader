import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import {
  acceptDuelInvite,
  getDuelByInviteCode,
} from "@/lib/services/competitions";
import { getPublicAppUrl } from "@/lib/share/public-url";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const duel = await getDuelByInviteCode(code);
  if (!duel) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }
  return NextResponse.json({
    inviteCode: duel.inviteCode,
    status: duel.status,
    title: duel.title,
    durationDays: duel.durationDays,
    message: duel.message,
    creator: duel.creator,
    opponent: duel.opponent,
    inviteUrl: `${getPublicAppUrl()}/challenge/${duel.inviteCode}`,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { code } = await params;
    const duel = await acceptDuelInvite(code, user.id);
    return NextResponse.json({ duel });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 400 }
    );
  }
}
