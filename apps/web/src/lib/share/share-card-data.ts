import { prisma } from "@auxano/database";
import { decimalToNumber, tickLivePrice } from "@auxano/shared";
import { getOrFetchQuote } from "@/lib/services/market";
import {
  portfolioShareUrl,
  strategyShareUrl,
  shareImageApiUrl,
} from "@/lib/share/public-url";
import { periodReturnPct, type ChartPoint } from "@/lib/share/chart-path";

export const SHARE_DISCLAIMER =
  "Simulated paper trading only. Not financial advice. Past simulated performance does not guarantee future results.";

export type SharePeriod = "week" | "30d";

const PERIOD_DAYS: Record<SharePeriod, number> = {
  week: 7,
  "30d": 30,
};

export type PortfolioShareCard = {
  visible: boolean;
  kind: "portfolio";
  username: string;
  displayName: string;
  period: SharePeriod;
  periodLabel: string;
  returnPct: number;
  spyReturnPct: number;
  alphaVsSpy: number;
  portfolioValue: number;
  topStrategy: {
    name: string;
    slug: string;
    quantScore: number;
    historicalReturn: number;
  } | null;
  equityCurve: ChartPoint[];
  spyCurve: ChartPoint[];
  publicUrl: string;
  imageUrl: string;
  generatedAt: string;
};

export type StrategyShareCard = {
  visible: boolean;
  kind: "strategy";
  slug: string;
  name: string;
  category: string;
  quantScore: number;
  historicalReturn: number;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  creator: { name: string | null; username: string | null };
  equityCurve: ChartPoint[];
  spyCurve: ChartPoint[];
  publicUrl: string;
  imageUrl: string;
  generatedAt: string;
};

async function canViewPortfolioPublic(
  userId: string,
  isProfilePublic: boolean,
  viewerId?: string | null
): Promise<boolean> {
  if (viewerId === userId) return true;
  if (isProfilePublic) return true;
  if (!viewerId) return false;
  const friend = await prisma.userFollow.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { followerId: viewerId, followingId: userId },
        { followerId: userId, followingId: viewerId },
      ],
    },
  });
  return !!friend;
}

async function buildSpyCurve(
  dates: string[],
  days: number
): Promise<ChartPoint[]> {
  const sym = "SPY";
  let rows = await prisma.priceHistory.findMany({
    where: { symbol: sym },
    orderBy: { date: "desc" },
    take: days + 5,
  });

  if (rows.length < 2) {
    const live = await getOrFetchQuote(sym);
    let base = live?.price ?? 500;
    const q = await prisma.marketQuote.findUnique({ where: { symbol: sym } });
    if (q) base = decimalToNumber(q.price);
    const points: ChartPoint[] = [];
    for (let i = dates.length - 1; i >= 0; i--) {
      const tick = tickLivePrice(sym, base, base);
      base = tick.price;
      points.unshift({ date: dates[dates.length - 1 - i] ?? dates[0], value: tick.price });
    }
    return points.length ? points : dates.map((d, i) => ({ date: d, value: 100 + i * 0.1 }));
  }

  rows = rows.reverse();
  const closes = rows.map((r) => ({
    date: r.date.toISOString().split("T")[0],
    value: decimalToNumber(r.close),
  }));

  if (dates.length && closes.length) {
    const startVal = closes[0].value;
    return dates.map((date, i) => {
      const match = closes.find((c) => c.date === date);
      const v = match?.value ?? closes[Math.min(i, closes.length - 1)].value;
      return { date, value: v };
    });
  }

  return closes.slice(-days);
}

function filterSnapshotsByPeriod(
  snapshots: { recordedAt: Date; totalValue: { toString(): string } }[],
  days: number
): ChartPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = snapshots.filter((s) => s.recordedAt >= cutoff);
  const source = filtered.length >= 2 ? filtered : snapshots.slice(-Math.min(days, snapshots.length));
  return source.map((s) => ({
    date: s.recordedAt.toISOString().split("T")[0],
    value: decimalToNumber(s.totalValue),
  }));
}

export async function getPortfolioShareCard(
  username: string,
  period: SharePeriod = "week",
  viewerId?: string | null
): Promise<PortfolioShareCard | null> {
  const uname = username.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { username: uname },
    include: {
      paperAccount: {
        include: {
          positions: true,
        },
      },
      strategies: {
        where: { isPublished: true },
        orderBy: { quantScore: "desc" },
        take: 1,
        select: {
          name: true,
          slug: true,
          quantScore: true,
          historicalReturn: true,
        },
      },
    },
  });

  if (!user?.username) return null;

  const visible = await canViewPortfolioPublic(
    user.id,
    user.isProfilePublic,
    viewerId
  );

  const days = PERIOD_DAYS[period];
  const periodLabel = period === "week" ? "7-day" : "30-day";
  const publicUrl = portfolioShareUrl(user.username, period);

  if (!visible || !user.paperAccount) {
    return {
      visible: false,
      kind: "portfolio",
      username: user.username,
      displayName: user.name ?? user.username,
      period,
      periodLabel,
      returnPct: 0,
      spyReturnPct: 0,
      alphaVsSpy: 0,
      portfolioValue: 0,
      topStrategy: null,
      equityCurve: [],
      spyCurve: [],
      publicUrl,
      imageUrl: shareImageApiUrl({ type: "portfolio", username: user.username, period }),
      generatedAt: new Date().toISOString(),
    };
  }

  const acc = user.paperAccount;
  const cash = decimalToNumber(acc.cashBalance);
  const initial = decimalToNumber(acc.initialBalance);
  let posVal = 0;
  for (const p of acc.positions) {
    const live = await getOrFetchQuote(p.symbol);
    posVal += decimalToNumber(p.quantity) * (live?.price ?? 0);
  }
  const portfolioValue = cash + posVal;

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { accountId: acc.id },
    orderBy: { recordedAt: "asc" },
    take: 120,
  });

  let equityCurve = filterSnapshotsByPeriod(snapshots, days);
  if (equityCurve.length < 2) {
    equityCurve = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const progress = (days - i) / days;
      equityCurve.push({
        date: d.toISOString().split("T")[0],
        value: initial + (portfolioValue - initial) * progress,
      });
    }
  }

  const dates = equityCurve.map((p) => p.date);
  const spyCurve = await buildSpyCurve(dates, days);
  const returnPct = periodReturnPct(equityCurve);
  const spyReturnPct = periodReturnPct(spyCurve);

  const top = user.strategies[0];
  const topStrategy = top
    ? {
        name: top.name,
        slug: top.slug,
        quantScore: top.quantScore,
        historicalReturn: top.historicalReturn
          ? decimalToNumber(top.historicalReturn)
          : 0,
      }
    : null;

  return {
    visible: true,
    kind: "portfolio",
    username: user.username,
    displayName: user.name ?? user.username,
    period,
    periodLabel,
    returnPct,
    spyReturnPct,
    alphaVsSpy: returnPct - spyReturnPct,
    portfolioValue,
    topStrategy,
    equityCurve,
    spyCurve,
    publicUrl,
    imageUrl: shareImageApiUrl({
      type: "portfolio",
      username: user.username,
      period,
    }),
    generatedAt: new Date().toISOString(),
  };
}

export async function getStrategyShareCard(
  slug: string
): Promise<StrategyShareCard | null> {
  const strategy = await prisma.strategy.findFirst({
    where: { slug, isPublished: true, isPublic: true },
    include: {
      creator: { select: { name: true, username: true } },
      backtests: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        include: { result: true },
      },
    },
  });

  if (!strategy) return null;

  const result = strategy.backtests[0]?.result;
  const rawCurve = (result?.equityCurve as ChartPoint[] | null) ?? [];
  const equityCurve = rawCurve.slice(-60).map((p) => ({
    date: typeof p.date === "string" ? p.date : String(p.date),
    value: Number(p.value),
  }));

  const dates = equityCurve.map((p) => p.date);
  const spyCurve = await buildSpyCurve(dates, 30);

  const publicUrl = strategyShareUrl(strategy.slug);

  return {
    visible: true,
    kind: "strategy",
    slug: strategy.slug,
    name: strategy.name,
    category: strategy.category,
    quantScore: strategy.quantScore,
    historicalReturn: strategy.historicalReturn
      ? decimalToNumber(strategy.historicalReturn)
      : periodReturnPct(equityCurve),
    sharpeRatio: result?.sharpeRatio
      ? decimalToNumber(result.sharpeRatio)
      : null,
    maxDrawdown: result?.maxDrawdown
      ? decimalToNumber(result.maxDrawdown)
      : null,
    creator: strategy.creator,
    equityCurve,
    spyCurve,
    publicUrl,
    imageUrl: shareImageApiUrl({ type: "strategy", slug: strategy.slug }),
    generatedAt: new Date().toISOString(),
  };
}
