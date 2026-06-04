import { runBacktest, backtestToQuantScore } from "./backtest-engine";
import type { BacktestMetrics, StrategyLogic } from "./types";

const TRADING_DAYS_YEAR = 252;

/** Default base prices when live quotes unavailable */
export const PRESET_BASE_PRICES: Record<string, number> = {
  AAPL: 178,
  MSFT: 420,
  NVDA: 480,
  GOOGL: 140,
  AMZN: 185,
  TSLA: 240,
  META: 500,
  JNJ: 155,
  V: 280,
  SPY: 450,
  QQQ: 380,
  DIA: 390,
};

/**
 * Run a full 1-year (252 trading day) backtest per candidate symbol;
 * returns the best risk-adjusted result (prefers positive annual return).
 */
export function runPresetYearBacktest(
  logic: StrategyLogic,
  symbols: string[],
  basePrices: Record<string, number> = PRESET_BASE_PRICES
): {
  metrics: BacktestMetrics;
  quantScore: number;
  backtestSymbol: string;
} {
  const candidates = symbols.length > 0 ? symbols : ["SPY", "AAPL", "QQQ"];

  let best: {
    metrics: BacktestMetrics;
    quantScore: number;
    backtestSymbol: string;
    score: number;
  } | null = null;

  for (const symbol of candidates) {
    const basePrice = basePrices[symbol] ?? 100;
    const metrics = runBacktest({
      symbol,
      basePrice,
      days: TRADING_DAYS_YEAR,
      logic,
    });
    const quant = backtestToQuantScore(metrics);

    if (metrics.annualReturn <= 0 || metrics.totalTrades < 1) continue;

    const score =
      metrics.annualReturn * 2 +
      metrics.sharpeRatio * 15 +
      metrics.winRate * 0.5 -
      metrics.maxDrawdown * 0.4;

    if (!best || score > best.score) {
      best = {
        metrics,
        quantScore: quant.total,
        backtestSymbol: symbol,
        score,
      };
    }
  }

  if (!best) {
    const metrics = runBacktest({
      symbol: "SPY",
      basePrice: PRESET_BASE_PRICES.SPY,
      days: TRADING_DAYS_YEAR,
      logic,
    });
    const quant = backtestToQuantScore(metrics);
    return {
      metrics,
      quantScore: quant.total,
      backtestSymbol: "SPY",
    };
  }

  return {
    metrics: best.metrics,
    quantScore: best.quantScore,
    backtestSymbol: best.backtestSymbol,
  };
}

export function formatPresetMarketMetrics(metrics: BacktestMetrics) {
  const annual = Math.max(0, metrics.annualReturn);
  const sharpe = Math.max(0, metrics.sharpeRatio);
  const winRate = Math.max(0, Math.min(100, metrics.winRate));
  const maxDd = Math.max(0, metrics.maxDrawdown);
  return {
    historicalReturn: Math.round(annual * 10) / 10,
    sharpeRatio: Math.round(sharpe * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    maxDrawdown: Math.round(maxDd * 10) / 10,
    totalTrades: metrics.totalTrades,
    profitFactor: Math.round(metrics.profitFactor * 100) / 100,
  };
}
