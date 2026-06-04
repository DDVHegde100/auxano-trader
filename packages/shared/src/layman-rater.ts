import type { BacktestMetrics } from "./types";

export interface LaymanRating {
  score: number;
  grade: string;
  headline: string;
  summary: string;
  strengths: string[];
  cautions: string[];
  breakdown: {
    label: string;
    score: number;
    explanation: string;
  }[];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function rateAlgorithmLayman(metrics: BacktestMetrics): LaymanRating {
  const returnScore = clamp((metrics.annualReturn + 10) * 2.5, 0, 100);
  const safetyScore = clamp(100 - metrics.maxDrawdown * 2.5, 0, 100);
  const consistencyScore = clamp(metrics.winRate * 0.9, 0, 100);
  const efficiencyScore = clamp(metrics.sharpeRatio * 35, 0, 100);
  const activityScore = clamp(
    metrics.totalTrades > 0 ? 50 + Math.min(metrics.totalTrades, 30) : 20,
    0,
    100
  );

  const score = Math.round(
    returnScore * 0.3 +
      safetyScore * 0.25 +
      consistencyScore * 0.2 +
      efficiencyScore * 0.15 +
      activityScore * 0.1
  );

  const grade =
    score >= 85
      ? "Excellent"
      : score >= 70
        ? "Strong"
        : score >= 55
          ? "Solid"
          : score >= 40
            ? "Developing"
            : "Needs work";

  const headline =
    score >= 85
      ? "This strategy backtested exceptionally well"
      : score >= 70
        ? "A well-balanced choice for paper trading"
        : score >= 55
          ? "Decent results — understand the risks"
          : score >= 40
            ? "Mixed backtest — proceed with caution"
            : "Weak backtest — refine before deploying";

  const summary = `On historical simulation, this algorithm scored ${score}/100. It showed about ${metrics.annualReturn.toFixed(1)}% annualized return, ${metrics.winRate.toFixed(0)}% winning trades, and a worst pullback of ${metrics.maxDrawdown.toFixed(1)}%. Remember: past simulation does not guarantee future results.`;

  const strengths: string[] = [];
  const cautions: string[] = [];

  if (metrics.annualReturn > 8) strengths.push("Historically strong returns in backtest");
  else if (metrics.annualReturn < 0) cautions.push("Backtest showed negative returns");

  if (metrics.maxDrawdown < 15) strengths.push("Relatively controlled drawdowns");
  else if (metrics.maxDrawdown > 25) cautions.push("Large peak-to-trough drops in simulation");

  if (metrics.winRate > 55) strengths.push("More winners than losers in test trades");
  else if (metrics.winRate < 45) cautions.push("Less than half of trades were winners");

  if (metrics.sharpeRatio > 1) strengths.push("Good risk-adjusted performance (Sharpe)");
  if (metrics.totalTrades < 3) cautions.push("Very few trades — results may be unreliable");

  if (strengths.length === 0) strengths.push("Useful for learning how the strategy behaves");
  if (cautions.length === 0) cautions.push("Always paper trade first — no real money in v1");

  return {
    score,
    grade,
    headline,
    summary,
    strengths,
    cautions,
    breakdown: [
      {
        label: "Growth potential",
        score: Math.round(returnScore),
        explanation: "How strong returns looked in the backtest.",
      },
      {
        label: "Safety",
        score: Math.round(safetyScore),
        explanation: "Lower drawdowns score higher.",
      },
      {
        label: "Consistency",
        score: Math.round(consistencyScore),
        explanation: "Win rate and steady behavior.",
      },
      {
        label: "Efficiency",
        score: Math.round(efficiencyScore),
        explanation: "Return per unit of risk (Sharpe).",
      },
      {
        label: "Activity",
        score: Math.round(activityScore),
        explanation: "Enough trades to trust the sample.",
      },
    ],
  };
}
