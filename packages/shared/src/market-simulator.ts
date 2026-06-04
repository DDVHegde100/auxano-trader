/** Deterministic pseudo-random price movement for paper trading & backtests */

function hashSymbol(symbol: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < symbol.length; i++) {
    h = (h << 5) - h + symbol.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) / 2147483647;
}

export function getSimulatedPrice(
  symbol: string,
  basePrice: number,
  dayOffset = 0
): number {
  const noise = hashSymbol(symbol, dayOffset);
  const trend = Math.sin(dayOffset * 0.05 + hashSymbol(symbol, 0) * 10) * 0.02;
  const daily = (noise - 0.5) * 0.04 + trend;
  return Math.max(0.01, basePrice * (1 + daily));
}

export function generatePriceSeries(
  symbol: string,
  basePrice: number,
  days: number
): { date: string; open: number; high: number; low: number; close: number }[] {
  const series: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[] = [];
  let price = basePrice;
  const start = new Date();
  start.setDate(start.getDate() - days);

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const close = getSimulatedPrice(symbol, price, i);
    const open = price;
    const high = Math.max(open, close) * (1 + hashSymbol(symbol, i + 1) * 0.01);
    const low = Math.min(open, close) * (1 - hashSymbol(symbol, i + 2) * 0.01);
    series.push({
      date: d.toISOString().split("T")[0],
      open,
      high,
      low,
      close,
    });
    price = close;
  }
  return series;
}

export const DEFAULT_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc.", basePrice: 178.5, sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", basePrice: 378.2, sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", basePrice: 141.8, sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", basePrice: 178.9, sector: "Consumer" },
  { symbol: "NVDA", name: "NVIDIA Corp.", basePrice: 495.2, sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", basePrice: 248.4, sector: "Automotive" },
  { symbol: "META", name: "Meta Platforms", basePrice: 485.1, sector: "Technology" },
  { symbol: "JPM", name: "JPMorgan Chase", basePrice: 198.3, sector: "Finance" },
  { symbol: "V", name: "Visa Inc.", basePrice: 275.6, sector: "Finance" },
  { symbol: "JNJ", name: "Johnson & Johnson", basePrice: 156.2, sector: "Healthcare" },
];
