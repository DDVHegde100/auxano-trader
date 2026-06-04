import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function getLeaderboards() {
  const [topStrategies, topCreators, topTraders] = await Promise.all([
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
      take: 20,
    }),
    prisma.paperAccount.findMany({
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        positions: true,
      },
      take: 20,
    }),
  ]);

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
    .slice(0, 10);

  const quotes = await prisma.marketQuote.findMany();
  const quoteMap = new Map(
    quotes.map((q) => [q.symbol, decimalToNumber(q.price)])
  );

  const traders = topTraders
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
      };
    })
    .sort((a, b) => b.returnPct - a.returnPct)
    .slice(0, 10);

  return {
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
    topTraders: traders,
  };
}
