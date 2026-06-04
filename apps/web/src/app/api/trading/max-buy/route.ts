import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: "symbol required" }, { status: 400 });
    }

    const [account, quote] = await Promise.all([
      prisma.paperAccount.findUnique({ where: { userId: user.id } }),
      prisma.marketQuote.findUnique({ where: { symbol } }),
    ]);

    if (!account || !quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cash = decimalToNumber(account.cashBalance);
    const price = decimalToNumber(quote.price);
    const maxShares = price > 0 ? Math.floor(cash / price) : 0;

    return NextResponse.json({
      symbol,
      cashBalance: cash,
      price,
      maxShares,
      maxCost: maxShares * price,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
