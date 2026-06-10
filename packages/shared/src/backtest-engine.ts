import { calculateQuantScore } from "./quant-score";
import { generatePriceSeries, hashSymbolForSim } from "./market-simulator";
import {
  buildIndicatorContext,
  computeRSI,
  evaluateStrategySignal,
  sma,
} from "./strategy-signals";
import type {
  BacktestMetrics,
  StrategyLogic,
  TradeLogEntry,
  EquityPoint,
} from "./types";

export function runBacktest(params: {
  symbol: string;
  basePrice: number;
  days: number;
  logic: StrategyLogic;
  initialCapital?: number;
}): BacktestMetrics {
  const { symbol, basePrice, days, logic } = params;
  const capital0 = params.initialCapital ?? 100_000;
  const series = generatePriceSeries(symbol, basePrice, days);
  const closes = series.map((s) => s.close);

  let cash = capital0;
  let shares = 0;
  let entryPrice = 0;
  const tradeLog: TradeLogEntry[] = [];
  const equityCurve: EquityPoint[] = [];
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let peak = capital0;
  let maxDrawdown = 0;
  let highSinceEntry = 0;

  const benchmarkStart = closes[0];
  const benchmarkCurve: EquityPoint[] = [];

  for (let i = 50; i < series.length; i++) {
    const slice = closes.slice(0, i + 1);
    const price = closes[i];
    if (shares > 0) highSinceEntry = Math.max(highSinceEntry, price);

    const signal = evaluateStrategySignal(logic, {
      ...buildIndicatorContext(slice, {
        quantity: shares,
        averageCost: entryPrice,
        currentPrice: price,
      }),
      volumeRatio:
        0.85 + (Math.sin(i * 0.31 + hashSymbolForSim(symbol, i)) * 0.5 + 0.5) * 0.55,
    });

    if (signal === "BUY" && shares === 0 && cash > price) {
      const qty = Math.floor((cash * 0.95) / price);
      if (qty > 0) {
        shares = qty;
        entryPrice = price;
        highSinceEntry = price;
        cash -= qty * price;
        tradeLog.push({
          date: series[i].date,
          symbol,
          side: "BUY",
          price,
          quantity: qty,
        });
      }
    } else if (signal === "SELL" && shares > 0) {
      const proceeds = shares * price;
      const pnl = proceeds - shares * entryPrice;
      cash += proceeds;
      if (pnl >= 0) {
        wins++;
        grossProfit += pnl;
      } else {
        losses++;
        grossLoss += Math.abs(pnl);
      }
      tradeLog.push({
        date: series[i].date,
        symbol,
        side: "SELL",
        price,
        quantity: shares,
        pnl,
      });
      shares = 0;
      entryPrice = 0;
    }

    const equity = cash + shares * price;
    peak = Math.max(peak, equity);
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, dd);

    equityCurve.push({
      date: series[i].date,
      value: equity,
      benchmark: (price / benchmarkStart) * capital0,
    });
    benchmarkCurve.push({
      date: series[i].date,
      value: (price / benchmarkStart) * capital0,
    });
  }

  const finalEquity =
    cash + shares * (closes[closes.length - 1] ?? basePrice);
  const totalReturn = (finalEquity - capital0) / capital0;
  const annualReturn = totalReturn * (252 / days) * 100;

  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].value;
    const curr = equityCurve[i].value;
    if (prev > 0) returns.push((curr - prev) / prev);
  }
  const mean =
    returns.length > 0
      ? returns.reduce((a, b) => a + b, 0) / returns.length
      : 0;
  const std =
    returns.length > 1
      ? Math.sqrt(
          returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1)
        )
      : 0.01;
  const sharpeRatio = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

  const downside = returns.filter((r) => r < 0);
  const downsideStd =
    downside.length > 1
      ? Math.sqrt(
          downside.reduce((s, r) => s + r ** 2, 0) / downside.length
        )
      : 0.01;
  const sortinoRatio =
    downsideStd > 0 ? (mean / downsideStd) * Math.sqrt(252) : sharpeRatio;

  const totalTrades = tradeLog.filter((t) => t.side === "SELL").length;
  const winRate =
    totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 2 : 1;

  const volatility =
    std * Math.sqrt(252) * 100;

  return {
    annualReturn,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    totalTrades,
    equityCurve,
    benchmarkCurve,
    tradeLog,
  };
}

export function backtestToQuantScore(metrics: BacktestMetrics) {
  return calculateQuantScore({
    annualReturn: metrics.annualReturn / 100,
    sharpeRatio: metrics.sharpeRatio,
    maxDrawdown: metrics.maxDrawdown,
    winRate: metrics.winRate,
    volatility: metrics.sharpeRatio > 0 ? 20 : 40,
  });
}
