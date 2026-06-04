import { NextResponse } from "next/server";
import { getLeaderboards } from "@/lib/services/leaderboard";

export async function GET() {
  const data = await getLeaderboards();
  return NextResponse.json(data);
}
