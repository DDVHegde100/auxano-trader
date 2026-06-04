import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import {
  getPortfolioShareCard,
  type SharePeriod,
} from "@/lib/share/share-card-data";
import { SHARE_DISCLAIMER } from "@/lib/share/share-card-data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const url = new URL(req.url);
  const period = (url.searchParams.get("period") === "30d" ? "30d" : "week") as SharePeriod;
  const viewer = await getOrCreateDbUser(req);
  const card = await getPortfolioShareCard(username, period, viewer?.id ?? null);

  if (!card) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ...card, disclaimer: SHARE_DISCLAIMER });
}
