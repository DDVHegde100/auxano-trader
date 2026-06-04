import { NextResponse } from "next/server";
import { getStrategyShareCard } from "@/lib/share/share-card-data";
import { SHARE_DISCLAIMER } from "@/lib/share/share-card-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const card = await getStrategyShareCard(slug);
  if (!card) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  return NextResponse.json({ ...card, disclaimer: SHARE_DISCLAIMER });
}
