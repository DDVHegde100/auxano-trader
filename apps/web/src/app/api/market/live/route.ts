import { NextResponse } from "next/server";
import { refreshLiveQuotes } from "@/lib/services/market";

export async function GET() {
  const quotes = await refreshLiveQuotes();
  return NextResponse.json({ quotes, refreshedAt: new Date().toISOString() });
}
