import { NextResponse } from "next/server";
import { refreshLiveQuotes, getQuoteDetail } from "@/lib/services/market";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const live = searchParams.get("live") !== "false";

  if (symbol) {
    const detail = await getQuoteDetail(symbol);
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(detail);
  }

  const quotes = live ? await refreshLiveQuotes() : await refreshLiveQuotes();
  return NextResponse.json({ quotes, refreshedAt: new Date().toISOString() });
}
