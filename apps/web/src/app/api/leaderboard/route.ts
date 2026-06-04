import { NextResponse } from "next/server";
import { getLeaderboards } from "@/lib/services/leaderboard";
import { getOrCreateDbUser } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const user = await getOrCreateDbUser(req);
  const data = await getLeaderboards({
    refresh,
    viewerId: user?.id,
  });
  return NextResponse.json(data);
}
