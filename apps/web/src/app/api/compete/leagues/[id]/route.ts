import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import {
  computeLeagueStandings,
  joinLeague,
} from "@/lib/services/competitions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { id } = await params;
    const data = await computeLeagueStandings(id, user.id);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { id } = await params;
    await joinLeague(user.id, id);
    const data = await computeLeagueStandings(id, user.id);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
