import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";
import { getOrFetchQuote } from "./market";

export type TraderRankRow = {
  userId: string;
  username: string | null;
  name: string | null;
  returnPct: number;
  rank: number;
};

/** Full paper-trader ranking for leaderboard pass detection. */
export async function getAllTraderRanks(): Promise<TraderRankRow[]> {
  const accounts = await prisma.paperAccount.findMany({
    include: {
      user: {
        select: { id: true, username: true, name: true, isProfilePublic: true },
      },
      positions: true,
    },
  });

  const quotes = await prisma.marketQuote.findMany();
  const quoteMap = new Map(quotes.map((q) => [q.symbol, decimalToNumber(q.price)]));

  const rows = accounts
    .map((acc) => {
      const cash = decimalToNumber(acc.cashBalance);
      const initial = decimalToNumber(acc.initialBalance);
      let posVal = 0;
      for (const p of acc.positions) {
        posVal += decimalToNumber(p.quantity) * (quoteMap.get(p.symbol) ?? 0);
      }
      const total = cash + posVal;
      const returnPct = initial > 0 ? ((total - initial) / initial) * 100 : 0;
      return {
        userId: acc.user.id,
        username: acc.user.username,
        name: acc.user.name,
        returnPct,
        isPublic: acc.user.isProfilePublic,
      };
    })
    .filter((r) => r.username)
    .sort((a, b) => b.returnPct - a.returnPct);

  return rows.map((r, i) => ({
    userId: r.userId,
    username: r.username,
    name: r.name,
    returnPct: r.returnPct,
    rank: i + 1,
  }));
}

export async function getTraderRank(userId: string): Promise<number | null> {
  const ranks = await getAllTraderRanks();
  return ranks.find((r) => r.userId === userId)?.rank ?? null;
}

/** Notify friends who were overtaken after a trade improves rank. */
export async function notifyLeaderboardPassesAfterTrade(
  traderUserId: string,
  rankBefore: number | null,
  rankAfter: number | null
) {
  if (rankAfter == null || rankBefore == null) return;
  if (rankAfter >= rankBefore) return;

  const trader = await prisma.user.findUnique({
    where: { id: traderUserId },
    select: { id: true, username: true, name: true },
  });
  if (!trader) return;

  const friendships = await prisma.userFollow.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ followerId: traderUserId }, { followingId: traderUserId }],
    },
  });

  const friendIds = friendships.map((f) =>
    f.followerId === traderUserId ? f.followingId : f.followerId
  );
  if (!friendIds.length) return;

  const ranks = await getAllTraderRanks();
  const rankMap = new Map(ranks.map((r) => [r.userId, r.rank]));

  const { notifyLeaderboardPassed } = await import("./notifications");

  for (const fid of friendIds) {
    const friendRank = rankMap.get(fid);
    if (
      friendRank != null &&
      friendRank > rankAfter &&
      friendRank <= rankBefore
    ) {
      await notifyLeaderboardPassed({
        toUserId: fid,
        passerUserId: trader.id,
        passerUsername: trader.username,
        passerName: trader.name,
        newRank: rankAfter,
      });
    }
  }
}
