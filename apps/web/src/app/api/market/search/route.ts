import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/services/market";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }
  const results = await searchSymbols(q);
  return NextResponse.json({ results });
}
