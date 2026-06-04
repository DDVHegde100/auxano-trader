import type { QuantScoreBreakdown } from "./types";

export function calculateQuantScore(metrics: {
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  volatility: number;
  consistency?: number;
}): QuantScoreBreakdown {
  const clamp = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(min, n));

  const returns = clamp(metrics.annualReturn * 4, 0, 200);
  const sharpe = clamp(metrics.sharpeRatio * 80, 0, 200);
  const drawdown = clamp(200 - Math.abs(metrics.maxDrawdown) * 5, 0, 200);
  const winRate = clamp(metrics.winRate * 2, 0, 150);
  const volatility = clamp(150 - metrics.volatility * 3, 0, 150);
  const riskManagement = clamp((drawdown + volatility) / 2, 0, 175);
  const consistency =
    metrics.consistency ?? clamp(winRate * 0.6 + sharpe * 0.4, 0, 175);

  const total = Math.round(
    clamp(
      returns * 0.2 +
        sharpe * 0.2 +
        drawdown * 0.15 +
        winRate * 0.1 +
        volatility * 0.1 +
        riskManagement * 0.15 +
        consistency * 0.1,
      0,
      1000
    )
  );

  return {
    total,
    consistency: Math.round(consistency),
    riskManagement: Math.round(riskManagement),
    drawdown: Math.round(drawdown),
    returns: Math.round(returns),
    volatility: Math.round(volatility),
    sharpe: Math.round(sharpe),
  };
}
