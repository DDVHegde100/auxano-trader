import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const lists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { items: true },
    });

    const symbols = lists.flatMap((l) => l.items.map((i) => i.symbol));
    const quotes = await prisma.marketQuote.findMany({
      where: { symbol: { in: symbols } },
    });
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    return NextResponse.json({
      watchlists: lists.map((l) => ({
        id: l.id,
        name: l.name,
        items: l.items.map((i) => {
          const q = quoteMap.get(i.symbol);
          return {
            symbol: i.symbol,
            name: q?.name ?? i.symbol,
            price: q ? decimalToNumber(q.price) : 0,
            changePct: q ? decimalToNumber(q.changePct) : 0,
          };
        }),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const { symbol, watchlistId } = await req.json();
    const sym = symbol.toUpperCase();

    let listId = watchlistId;
    if (!listId) {
      const list = await prisma.watchlist.findFirst({ where: { userId: user.id } });
      if (!list) {
        const created = await prisma.watchlist.create({
          data: { userId: user.id, items: { create: { symbol: sym } } },
        });
        return NextResponse.json({ success: true, watchlistId: created.id });
      }
      listId = list.id;
    }

    await prisma.watchlistItem.upsert({
      where: { watchlistId_symbol: { watchlistId: listId, symbol: sym } },
      create: { watchlistId: listId, symbol: sym },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}
