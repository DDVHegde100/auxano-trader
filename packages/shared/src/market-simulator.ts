/** Deterministic pseudo-random price movement for paper trading & backtests */

export function hashSymbolForSim(symbol: string, seed: number): number {
  let h = Math.imul(seed, 2654435761) >>> 0;
  for (let i = 0; i < symbol.length; i++) {
    h = Math.imul(h ^ symbol.charCodeAt(i), 2246822507) >>> 0;
  }
  return h / 4294967296;
}

/** Per-symbol drift & volatility for realistic 1Y backtests */
function symbolRegime(symbol: string) {
  const h = hashSymbolForSim(symbol, 0);
  const drift = 0.00035 + h * 0.00025;
  const vol = 0.012 + hashSymbolForSim(symbol, 7) * 0.008;
  const cycle = 40 + Math.floor(hashSymbolForSim(symbol, 3) * 30);
  return { drift, vol, cycle };
}

export function getSimulatedPrice(
  symbol: string,
  basePrice: number,
  dayOffset = 0
): number {
  const { drift, vol, cycle } = symbolRegime(symbol);
  const noise = (hashSymbolForSim(symbol, dayOffset) - 0.5) * 2;
  const cyclical = Math.sin((dayOffset / cycle) * Math.PI * 2) * 0.004;
  const daily = drift + cyclical + noise * vol;
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
    const high = Math.max(open, close) * (1 + hashSymbolForSim(symbol, i + 1) * 0.008);
    const low = Math.min(open, close) * (1 - hashSymbolForSim(symbol, i + 2) * 0.008);
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
