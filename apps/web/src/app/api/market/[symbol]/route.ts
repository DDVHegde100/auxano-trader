import { NextResponse } from "next/server";
import { getQuoteDetail } from "@/lib/services/market";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const detail = await getQuoteDetail(symbol);
  if (!detail) {
    return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
