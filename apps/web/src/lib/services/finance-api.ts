/**
 * Live market data via Yahoo Finance (no API key) with optional Finnhub fallback.
 */

export interface LiveQuoteDto {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  sector?: string;
  volume: string;
  updatedAt: string;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; AuxanoTrader/1.0)",
};

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  if (!query || query.length < 1) return [];
  const q = encodeURIComponent(query.trim());
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=12&newsCount=0`;

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    const quotes = data?.quotes ?? [];
    return quotes
      .filter((x: { symbol?: string }) => x.symbol)
      .map((x: { symbol: string; shortname?: string; longname?: string; quoteType?: string; exchange?: string }) => ({
        symbol: x.symbol.toUpperCase(),
        name: x.shortname ?? x.longname ?? x.symbol,
        type: x.quoteType ?? "EQUITY",
        exchange: x.exchange ?? "NASDAQ",
      }));
  } catch {
    return [];
  }
}

export async function fetchYahooQuote(symbol: string): Promise<LiveQuoteDto | null> {
  const sym = symbol.toUpperCase();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`;

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price = meta.regularMarketPrice as number;
    const prev = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
    const change = price - prev;
    const changePct = prev > 0 ? (change / prev) * 100 : 0;
    const spread = price * 0.0003;

    return {
      symbol: sym,
      name: (meta.shortName ?? meta.longName ?? sym) as string,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      bid: Math.round((price - spread) * 100) / 100,
      ask: Math.round((price + spread) * 100) / 100,
      sector: undefined,
      volume: String(meta.regularMarketVolume ?? 0),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchFinnhubQuote(symbol: string): Promise<LiveQuoteDto | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${key}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const q = await res.json();
    if (q.c == null) return null;

    const price = q.c as number;
    const prev = (q.pc ?? q.c) as number;
    const change = price - prev;
    const changePct = prev > 0 ? (change / prev) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      bid: price * 0.9998,
      ask: price * 1.0002,
      volume: "0",
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchLiveQuote(symbol: string): Promise<LiveQuoteDto | null> {
  const finnhub = await fetchFinnhubQuote(symbol);
  if (finnhub) return finnhub;
  return fetchYahooQuote(symbol);
}
