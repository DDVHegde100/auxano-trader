import { prisma } from "@auxano/database";
import {
  tickLivePrice,
  generateIntradayBars,
  decimalToNumber,
} from "@auxano/shared";

export async function refreshLiveQuotes() {
  const quotes = await prisma.marketQuote.findMany();
  const updated = [];

  for (const q of quotes) {
    const base = decimalToNumber(q.price);
    const tick = tickLivePrice(q.symbol, base, base);
    const row = await prisma.marketQuote.update({
      where: { symbol: q.symbol },
      data: {
        price: tick.price,
        change: tick.change,
        changePct: tick.changePct,
      },
    });
    updated.push({
      symbol: row.symbol,
      name: row.name,
      price: tick.price,
      change: tick.change,
      changePct: tick.changePct,
      bid: tick.bid,
      ask: tick.ask,
      sector: row.sector,
      volume: row.volume.toString(),
      updatedAt: tick.timestamp,
    });
  }

  return updated;
}

export async function getQuoteDetail(symbol: string) {
  const q = await prisma.marketQuote.findUnique({
    where: { symbol: symbol.toUpperCase() },
    include: {
      priceHistory: { orderBy: { date: "desc" }, take: 90 },
    },
  });
  if (!q) return null;

  const base = decimalToNumber(q.price);
  const live = tickLivePrice(q.symbol, base, base);
  const intraday = generateIntradayBars(q.symbol, base);

  await prisma.marketQuote.update({
    where: { symbol: q.symbol },
    data: {
      price: live.price,
      change: live.change,
      changePct: live.changePct,
    },
  });

  return {
    symbol: q.symbol,
    name: q.name,
    sector: q.sector,
    price: live.price,
    change: live.change,
    changePct: live.changePct,
    bid: live.bid,
    ask: live.ask,
    high52: q.high52 ? decimalToNumber(q.high52) : null,
    low52: q.low52 ? decimalToNumber(q.low52) : null,
    volume: q.volume.toString(),
    updatedAt: live.timestamp,
    intraday,
    history: q.priceHistory
      .slice()
      .reverse()
      .map((h) => ({
        date: h.date.toISOString().split("T")[0],
        close: decimalToNumber(h.close),
        open: decimalToNumber(h.open),
        high: decimalToNumber(h.high),
        low: decimalToNumber(h.low),
      })),
  };
}
