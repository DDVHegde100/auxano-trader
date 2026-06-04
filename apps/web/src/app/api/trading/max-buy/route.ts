import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";
import { getOrFetchQuote } from "@/lib/services/market";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: "symbol required" }, { status: 400 });
    }

    const account = await prisma.paperAccount.findUnique({
      where: { userId: user.id },
      include: { positions: true },
    });
    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const live = await getOrFetchQuote(symbol);
    const dbQuote = await prisma.marketQuote.findUnique({ where: { symbol } });
    const price =
      live?.price ??
      (dbQuote ? decimalToNumber(dbQuote.price) : 0);
    if (price <= 0) {
      return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
    }

    const cash = decimalToNumber(account.cashBalance);
    const position = account.positions.find((p) => p.symbol === symbol);
    const positionShares = position
      ? decimalToNumber(position.quantity)
      : 0;
    const maxShares = Math.floor(cash / price);
    const maxBuyUsd = maxShares * price;
    const maxSellUsd = positionShares * price;

    return NextResponse.json({
      symbol,
      cashBalance: cash,
      price,
      maxShares,
      maxBuyUsd,
      positionShares,
      maxSellUsd,
      maxCost: maxBuyUsd,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
