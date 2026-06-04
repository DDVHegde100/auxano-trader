import { prisma } from "@auxano/database";
import {
  buildPortfolioSummary,
  calculatePositionMetrics,
  decimalToNumber,
} from "@auxano/shared";
import type { DashboardData } from "@auxano/shared";

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const account = await prisma.paperAccount.findUnique({
    where: { userId },
    include: {
      positions: true,
      trades: { orderBy: { executedAt: "desc" }, take: 8 },
    },
  });

  if (!account) throw new Error("Paper account not found");

  const symbols = account.positions.map((p) => p.symbol);
  const quotes = await prisma.marketQuote.findMany({
    where: { symbol: { in: symbols.length ? symbols : ["AAPL"] } },
  });
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const cash = decimalToNumber(account.cashBalance);
  const initial = decimalToNumber(account.initialBalance);
  const realized = decimalToNumber(account.realizedPnl);

  const positions = account.positions.map((p) => {
    const q = quoteMap.get(p.symbol);
    return calculatePositionMetrics(
      p,
      q ?? { name: p.symbol, price: { toString: () => "100" } },
      cash +
        account.positions.reduce(
          (s, pos) =>
            s +
            decimalToNumber(pos.quantity) *
              decimalToNumber(
                quoteMap.get(pos.symbol)?.price ?? { toString: () => "100" }
              ),
          0
        )
    );
  });

  const deployments = await prisma.strategyDeployment.count({
    where: { userId, isActive: true },
  });

  const summary = buildPortfolioSummary({
    cashBalance: cash,
    initialBalance: initial,
    realizedPnl: realized,
    positions,
    activeStrategies: deployments,
  });

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { accountId: account.id },
    orderBy: { recordedAt: "asc" },
    take: 90,
  });

  const performance =
    snapshots.length > 0
      ? snapshots.map((s) => ({
          date: s.recordedAt.toISOString().split("T")[0],
          value: decimalToNumber(s.totalValue),
        }))
      : generateDefaultCurve(summary.portfolioValue, initial);

  const allocation = [
    { label: "Cash", value: summary.cashBalance, color: "#C7C7C7" },
    ...positions.map((p, i) => ({
      label: p.symbol,
      value: p.marketValue,
      color: ["#00C853", "#4FC3F7", "#FFB74D", "#BA68C8", "#FF5252"][i % 5],
    })),
  ].filter((a) => a.value > 0);

  return {
    summary,
    performance,
    allocation,
    recentTrades: account.trades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      quantity: decimalToNumber(t.quantity),
      price: decimalToNumber(t.price),
      executedAt: t.executedAt.toISOString(),
    })),
  };
}

function generateDefaultCurve(current: number, initial: number) {
  const points = [];
  const days = 30;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const progress = (days - i) / days;
    const value = initial + (current - initial) * progress;
    points.push({
      date: d.toISOString().split("T")[0],
      value: value * (0.98 + Math.sin(i) * 0.02),
    });
  }
  return points;
}

export async function recordPortfolioSnapshot(accountId: string) {
  const account = await prisma.paperAccount.findUnique({
    where: { id: accountId },
    include: { positions: true },
  });
  if (!account) return;

  const symbols = account.positions.map((p) => p.symbol);
  const quotes = await prisma.marketQuote.findMany({
    where: { symbol: { in: symbols } },
  });
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const cash = decimalToNumber(account.cashBalance);
  const initial = decimalToNumber(account.initialBalance);
  let positionsValue = 0;
  for (const p of account.positions) {
    const price = decimalToNumber(
      quoteMap.get(p.symbol)?.price ?? { toString: () => "0" }
    );
    positionsValue += decimalToNumber(p.quantity) * price;
  }

  const total = cash + positionsValue;
  const totalReturnPct = initial > 0 ? ((total - initial) / initial) * 100 : 0;

  await prisma.portfolioSnapshot.create({
    data: {
      accountId,
      totalValue: total,
      cashBalance: cash,
      positionsValue,
      dailyPnl: total * 0.001,
      totalReturnPct,
    },
  });
}
