import { getSimulatedPrice } from "./market-simulator";

/** Tick live prices from stored base — deterministic per minute */
export function tickLivePrice(
  symbol: string,
  basePrice: number,
  previousPrice?: number
): {
  price: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  timestamp: string;
} {
  const minuteSeed = Math.floor(Date.now() / 60_000);
  const price = getSimulatedPrice(symbol, basePrice, minuteSeed);
  const prev = previousPrice ?? basePrice;
  const change = price - prev;
  const changePct = prev > 0 ? (change / prev) * 100 : 0;
  const spread = price * 0.0005;

  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    bid: Math.round((price - spread) * 100) / 100,
    ask: Math.round((price + spread) * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

export function generateIntradayBars(
  symbol: string,
  basePrice: number,
  points = 78
): { time: string; price: number }[] {
  const bars: { time: string; price: number }[] = [];
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    const t = new Date(now - i * 5 * 60_000);
    const seed = Math.floor(t.getTime() / 300_000);
    bars.push({
      time: t.toISOString(),
      price: getSimulatedPrice(symbol, basePrice, seed),
    });
  }
  return bars;
}
