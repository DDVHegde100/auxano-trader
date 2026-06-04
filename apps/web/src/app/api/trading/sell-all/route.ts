import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { executePaperTrade } from "@/lib/services/trading";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json().catch(() => ({}));
    const symbolFilter = body.symbol?.toUpperCase();

    const account = await prisma.paperAccount.findUnique({
      where: { userId: user.id },
      include: { positions: true },
    });
    if (!account) {
      return NextResponse.json({ error: "No account" }, { status: 404 });
    }

    const positions = symbolFilter
      ? account.positions.filter((p) => p.symbol === symbolFilter)
      : account.positions;

    const results = [];
    for (const pos of positions) {
      const qty = decimalToNumber(pos.quantity);
      if (qty <= 0) continue;
      const result = await executePaperTrade({
        userId: user.id,
        symbol: pos.symbol,
        side: "SELL",
        quantity: qty,
      });
      results.push({ symbol: pos.symbol, ...result });
    }

    return NextResponse.json({ success: true, trades: results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sell failed" },
      { status: 400 }
    );
  }
}
