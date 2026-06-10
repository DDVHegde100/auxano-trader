import type { StrategyLogic } from "./types";

export type SignalAction = "BUY" | "SELL" | "HOLD";

export type IndicatorContext = {
  rsi: number;
  ma50: number;
  ma200: number;
  profitPct: number;
  volumeRatio: number;
  trailDrawdownPct: number;
};

export function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function buildIndicatorContext(
  closes: number[],
  position?: { quantity: number; averageCost: number; currentPrice: number }
): IndicatorContext {
  const rsi = computeRSI(closes);
  const ma50 = sma(closes, 20);
  const ma200 = sma(closes, 50);
  const lastClose = closes[closes.length - 1] ?? 0;
  const prevClose = closes[closes.length - 2] ?? lastClose;
  const volumeRatio = prevClose > 0 ? Math.abs((lastClose - prevClose) / prevClose) * 100 : 1;

  let profitPct = 0;
  let trailDrawdownPct = 0;
  if (position && position.quantity > 0 && position.averageCost > 0) {
    profitPct =
      ((position.currentPrice - position.averageCost) / position.averageCost) * 100;
    const high = Math.max(position.averageCost, position.currentPrice);
    trailDrawdownPct =
      high > 0 ? ((high - position.currentPrice) / high) * 100 : 0;
  }

  return {
    rsi,
    ma50,
    ma200,
    profitPct,
    volumeRatio,
    trailDrawdownPct,
  };
}

/** Evaluate block-based strategy rules against live indicator context. */
export function evaluateStrategySignal(
  logic: StrategyLogic,
  context: IndicatorContext
): SignalAction {
  let buyRules = 0;
  let buyRulesMet = 0;
  let sellSignal = false;

  for (const node of logic.nodes) {
    const indicator = String(node.data.indicator ?? "");
    const op = String(node.data.operator ?? "<");
    const threshold = Number(node.data.threshold ?? 30);
    const action = String(node.data.action ?? "");

    if (node.type !== "condition") continue;

    let triggered = false;
    if (indicator === "RSI" && op === "<") triggered = context.rsi < threshold;
    if (indicator === "RSI" && op === ">") triggered = context.rsi > threshold;
    if (indicator === "MA_CROSS" && op === ">")
      triggered = context.ma50 > context.ma200;
    if (indicator === "MA_CROSS" && op === "<")
      triggered = context.ma50 < context.ma200;
    if (indicator === "PROFIT" && op === ">")
      triggered = context.profitPct > threshold;
    if (indicator === "STOP_LOSS")
      triggered = context.profitPct < -threshold;
    if (indicator === "TRAILING_STOP")
      triggered = context.trailDrawdownPct > threshold;
    if (indicator === "VOLUME" && op === ">")
      triggered = context.volumeRatio > threshold;

    if (action === "BUY") {
      buyRules++;
      if (triggered) buyRulesMet++;
    }
    if (triggered && action === "SELL") sellSignal = true;
  }

  if (sellSignal) return "SELL";
  if (buyRules > 0 && buyRulesMet === buyRules) return "BUY";
  return "HOLD";
}
