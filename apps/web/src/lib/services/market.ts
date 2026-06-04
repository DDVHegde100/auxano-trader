import { prisma } from "@auxano/database";
import {
  tickLivePrice,
  generateIntradayBars,
  decimalToNumber,
} from "@auxano/shared";
import {
  fetchLiveQuote,
  searchSymbols,
  type LiveQuoteDto,
} from "@/lib/services/finance-api";

export { searchSymbols };

export async function upsertQuoteFromLive(dto: LiveQuoteDto) {
  await prisma.marketQuote.upsert({
    where: { symbol: dto.symbol },
    create: {
      symbol: dto.symbol,
      name: dto.name,
      price: dto.price,
      change: dto.change,
      changePct: dto.changePct,
      sector: dto.sector ?? "Technology",
      volume: BigInt(dto.volume || "0"),
    },
    update: {
      name: dto.name,
      price: dto.price,
      change: dto.change,
      changePct: dto.changePct,
      volume: BigInt(dto.volume || "0"),
    },
  });
}

export async function refreshLiveQuotes() {
  const rows = await prisma.marketQuote.findMany();
  const updated: LiveQuoteDto[] = [];

  for (const q of rows) {
    const live = await fetchLiveQuote(q.symbol);
    if (live) {
      await upsertQuoteFromLive(live);
      updated.push(live);
      continue;
    }

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
      sector: row.sector ?? undefined,
      volume: row.volume.toString(),
      updatedAt: tick.timestamp,
    });
  }

  return updated;
}

export async function getOrFetchQuote(symbol: string) {
  const sym = symbol.toUpperCase();
  const live = await fetchLiveQuote(sym);
  if (live) {
    await upsertQuoteFromLive(live);
    return live;
  }

  const q = await prisma.marketQuote.findUnique({ where: { symbol: sym } });
  if (!q) return null;

  const base = decimalToNumber(q.price);
  const tick = tickLivePrice(sym, base, base);
  return {
    symbol: sym,
    name: q.name,
    price: tick.price,
    change: tick.change,
    changePct: tick.changePct,
    bid: tick.bid,
    ask: tick.ask,
    sector: q.sector,
    volume: q.volume.toString(),
    updatedAt: tick.timestamp,
  };
}

export async function getQuoteDetail(symbol: string) {
  const sym = symbol.toUpperCase();
  const live = await getOrFetchQuote(sym);
  const q = await prisma.marketQuote.findUnique({
    where: { symbol: sym },
    include: {
      priceHistory: { orderBy: { date: "desc" }, take: 90 },
    },
  });

  if (!live && !q) return null;

  const base = live?.price ?? (q ? decimalToNumber(q.price) : 100);
  const intraday = generateIntradayBars(sym, base);

  return {
    symbol: sym,
    name: live?.name ?? q?.name ?? sym,
    sector: q?.sector ?? "Technology",
    price: live?.price ?? base,
    change: live?.change ?? 0,
    changePct: live?.changePct ?? 0,
    bid: live?.bid ?? base,
    ask: live?.ask ?? base,
    high52: q?.high52 ? decimalToNumber(q.high52) : null,
    low52: q?.low52 ? decimalToNumber(q.low52) : null,
    volume: live?.volume ?? "0",
    updatedAt: live?.updatedAt ?? new Date().toISOString(),
    intraday,
    history: (q?.priceHistory ?? [])
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
