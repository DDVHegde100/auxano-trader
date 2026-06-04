import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { calculatePositionMetrics, decimalToNumber, buildPortfolioSummary } from "@auxano/shared";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const account = await prisma.paperAccount.findUnique({
      where: { userId: user.id },
      include: { positions: true },
    });
    if (!account) return NextResponse.json({ error: "No account" }, { status: 404 });

    const quotes = await prisma.marketQuote.findMany();
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
    const cash = decimalToNumber(account.cashBalance);

    const positions = account.positions.map((p) =>
      calculatePositionMetrics(
        p,
        quoteMap.get(p.symbol) ?? { name: p.symbol, price: { toString: () => "0" } },
        cash
      )
    );

    const summary = buildPortfolioSummary({
      cashBalance: cash,
      initialBalance: decimalToNumber(account.initialBalance),
      realizedPnl: decimalToNumber(account.realizedPnl),
      positions,
    });

    return NextResponse.json({ positions, summary });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
