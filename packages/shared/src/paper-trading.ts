import type { PositionView, PortfolioSummary } from "./types";

export function decimalToNumber(value: { toString(): string } | number | null): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : parseFloat(value.toString());
}

export function calculatePositionMetrics(
  position: {
    symbol: string;
    quantity: { toString(): string };
    averageCost: { toString(): string };
  },
  quote: { name: string; price: { toString(): string } },
  totalPortfolioValue: number
): PositionView {
  const quantity = decimalToNumber(position.quantity);
  const averageCost = decimalToNumber(position.averageCost);
  const currentPrice = decimalToNumber(quote.price);
  const marketValue = quantity * currentPrice;
  const costBasis = quantity * averageCost;
  const unrealizedPnl = marketValue - costBasis;
  const unrealizedPnlPct =
    costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
  const weight =
    totalPortfolioValue > 0
      ? (marketValue / totalPortfolioValue) * 100
      : 0;

  return {
    symbol: position.symbol,
    name: quote.name,
    quantity,
    averageCost,
    currentPrice,
    marketValue,
    unrealizedPnl,
    unrealizedPnlPct,
    weight,
  };
}

export function buildPortfolioSummary(params: {
  cashBalance: number;
  initialBalance: number;
  realizedPnl: number;
  positions: PositionView[];
  todayPnl?: number;
  activeStrategies?: number;
}): PortfolioSummary {
  const positionsValue = params.positions.reduce(
    (s, p) => s + p.marketValue,
    0
  );
  const unrealizedPnl = params.positions.reduce(
    (s, p) => s + p.unrealizedPnl,
    0
  );
  const portfolioValue = params.cashBalance + positionsValue;
  const totalReturn = portfolioValue - params.initialBalance;
  const totalReturnPct =
    params.initialBalance > 0
      ? (totalReturn / params.initialBalance) * 100
      : 0;
  const todayPnl = params.todayPnl ?? unrealizedPnl * 0.02;
  const todayPnlPct =
    portfolioValue > 0 ? (todayPnl / portfolioValue) * 100 : 0;

  return {
    portfolioValue,
    cashBalance: params.cashBalance,
    positionsValue,
    todayPnl,
    todayPnlPct,
    totalReturn,
    totalReturnPct,
    realizedPnl: params.realizedPnl,
    unrealizedPnl,
    activeStrategies: params.activeStrategies ?? 0,
  };
}

export function validateOrder(params: {
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  cashBalance: number;
  positionQuantity: number;
}): { valid: boolean; error?: string } {
  if (params.quantity <= 0) {
    return { valid: false, error: "Quantity must be positive" };
  }
  if (params.price <= 0) {
    return { valid: false, error: "Invalid price" };
  }
  const cost = params.quantity * params.price;
  if (params.side === "BUY" && cost > params.cashBalance) {
    return { valid: false, error: "Insufficient buying power" };
  }
  if (params.side === "SELL" && params.quantity > params.positionQuantity) {
    return { valid: false, error: "Insufficient shares" };
  }
  return { valid: true };
}

export function computeRealizedPnl(
  side: "BUY" | "SELL",
  quantity: number,
  price: number,
  averageCost: number
): number {
  if (side === "BUY") return 0;
  return (price - averageCost) * quantity;
}

export function computeNewAverageCost(
  currentQty: number,
  currentAvg: number,
  buyQty: number,
  buyPrice: number
): number {
  const totalQty = currentQty + buyQty;
  if (totalQty <= 0) return 0;
  return (currentQty * currentAvg + buyQty * buyPrice) / totalQty;
}
