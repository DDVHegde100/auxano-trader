import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { executePaperTrade } from "@/lib/services/trading";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const { symbol, side, quantity, amountUsd, strategyId, presetId } =
      await req.json();

    if (!symbol || !side) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hasAmount =
      amountUsd != null && amountUsd !== "" && Number(amountUsd) > 0;
    const hasQty = quantity != null && quantity !== "" && Number(quantity) > 0;
    if (!hasAmount && !hasQty) {
      return NextResponse.json(
        { error: "Enter a dollar amount to trade" },
        { status: 400 }
      );
    }

    const result = await executePaperTrade({
      userId: user.id,
      symbol,
      side: side.toUpperCase(),
      ...(hasAmount
        ? { amountUsd: Number(amountUsd) }
        : { quantity: Number(quantity) }),
      strategyId,
      presetId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Trade failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
