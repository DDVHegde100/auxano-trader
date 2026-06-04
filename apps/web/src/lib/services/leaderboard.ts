import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";
import { getOrFetchQuote, refreshLiveQuotes } from "./market";

import type { LeaderboardPayload, LeaderboardTrader } from "@/lib/types/leaderboard";

export type { LeaderboardPayload, LeaderboardTrader };

async function collectLeaderboardSymbols(): Promise<string[]> {
  const positions = await prisma.position.findMany({
    select: { symbol: true },
    distinct: ["symbol"],
  });
  const watchItems = await prisma.watchlistItem.findMany({
    select: { symbol: true },
    distinct: ["symbol"],
  });
  const set = new Set<string>();
  for (const p of positions) set.add(p.symbol);
  for (const w of watchItems) set.add(w.symbol);
  set.add("SPY");
  return [...set];
}

/** Refresh live prices for symbols that affect portfolio rankings. */
export async function refreshLeaderboardQuotes(): Promise<void> {
  const symbols = await collectLeaderboardSymbols();
  await Promise.all(symbols.map((s) => getOrFetchQuote(s)));
  await refreshLiveQuotes();
}

function buildQuoteMap(
  quotes: { symbol: string; price: { toString(): string } }[]
): Map<string, number> {
  return new Map(quotes.map((q) => [q.symbol, decimalToNumber(q.price)]));
}

export async function getLeaderboards(options?: {
  refresh?: boolean;
  viewerId?: string;
}): Promise<LeaderboardPayload> {
  if (options?.refresh) {
    await refreshLeaderboardQuotes();
  }

  const [topStrategies, topCreators, accounts, quotes] = await Promise.all([
    prisma.strategy.findMany({
      where: { isPublished: true },
      orderBy: { quantScore: "desc" },
      take: 10,
      include: {
        creator: { select: { name: true, username: true, avatarUrl: true } },
      },
    }),
    prisma.user.findMany({
      where: { onboardingComplete: true },
      include: {
        strategies: {
          where: { isPublished: true },
          select: { quantScore: true, followerCount: true },
        },
      },
      take: 50,
    }),
    prisma.paperAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            isProfilePublic: true,
          },
        },
        positions: true,
      },
    }),
    prisma.marketQuote.findMany(),
  ]);

  const quoteMap = buildQuoteMap(quotes);

  const creators = topCreators
    .map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatarUrl: u.avatarUrl,
      score: u.strategies.reduce((s, st) => s + st.quantScore, 0),
      followers: u.strategies.reduce((s, st) => s + st.followerCount, 0),
      strategyCount: u.strategies.length,
    }))
    .filter((c) => c.strategyCount > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const viewerId = options?.viewerId;
  const acceptedFriendIds = viewerId
    ? await getAcceptedFriendIds(viewerId)
    : new Set<string>();

  const tradersRaw = accounts
    .map((acc) => {
      const cash = decimalToNumber(acc.cashBalance);
      const initial = decimalToNumber(acc.initialBalance);
      let posVal = 0;
      for (const p of acc.positions) {
        const price = quoteMap.get(p.symbol) ?? 0;
        posVal += decimalToNumber(p.quantity) * price;
      }
      const total = cash + posVal;
      const returnPct = initial > 0 ? ((total - initial) / initial) * 100 : 0;
      return {
        user: acc.user,
        portfolioValue: total,
        returnPct,
        cashBalance: cash,
        positionsValue: posVal,
      };
    })
    .filter((t) => {
      if (!t.user.username) return false;
      if (t.user.isProfilePublic) return true;
      if (!viewerId) return false;
      if (t.user.id === viewerId) return true;
      return acceptedFriendIds.has(t.user.id);
    })
    .sort((a, b) => b.returnPct - a.returnPct)
    .slice(0, 10);

  const topTraders: LeaderboardTrader[] = tradersRaw.map((t, i) => ({
    ...t,
    rank: i + 1,
  }));

  return {
    refreshedAt: new Date().toISOString(),
    topStrategies: topStrategies.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      quantScore: s.quantScore,
      creator: s.creator,
      historicalReturn: s.historicalReturn
        ? decimalToNumber(s.historicalReturn)
        : 0,
    })),
    topCreators: creators,
    topTraders,
  };
}

async function getAcceptedFriendIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.userFollow.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ followerId: userId }, { followingId: userId }],
    },
    select: { followerId: true, followingId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.followerId === userId ? r.followingId : r.followerId);
  }
  return ids;
}
