import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { executePaperTrade } from "@/lib/services/trading";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const { symbol, side, quantity } = await req.json();

    if (!symbol || !side || !quantity) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await executePaperTrade({
      userId: user.id,
      symbol,
      side: side.toUpperCase(),
      quantity: Number(quantity),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Trade failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
