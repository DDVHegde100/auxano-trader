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
  if (params.side === "BUY" && cost > params.cashBalance + 0.01) {
    return { valid: false, error: "Insufficient buying power" };
  }
  if (params.side === "SELL" && params.quantity > params.positionQuantity + 1e-9) {
    return { valid: false, error: "Insufficient position value" };
  }
  return { valid: true };
}

/** Convert a dollar amount to whole shares at the given price. */
export function quantityFromNotional(
  amountUsd: number,
  price: number,
  side: "BUY" | "SELL",
  limits: { cashBalance: number; positionQuantity: number }
): { quantity: number; error?: string } {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { quantity: 0, error: "Enter a dollar amount greater than zero" };
  }
  if (price <= 0) {
    return { quantity: 0, error: "Invalid price" };
  }

  let qty = Math.floor(amountUsd / price);
  if (qty < 1) {
    return {
      quantity: 0,
      error: `Minimum order is one share (~${price.toFixed(2)} USD)`,
    };
  }

  if (side === "BUY") {
    const maxQty = Math.floor(limits.cashBalance / price);
    if (qty > maxQty) qty = maxQty;
    if (qty < 1) {
      return { quantity: 0, error: "Insufficient buying power" };
    }
    const cost = qty * price;
    if (cost > limits.cashBalance + 0.01) {
      return { quantity: 0, error: "Insufficient buying power" };
    }
  } else {
    const maxQty = Math.floor(limits.positionQuantity);
    if (qty > maxQty) qty = maxQty;
    if (qty < 1) {
      return { quantity: 0, error: "No shares to sell at this amount" };
    }
  }

  return { quantity: qty };
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
