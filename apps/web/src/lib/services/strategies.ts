import { prisma, StrategyCategory } from "@auxano/database";
import type { MarketplaceStrategy } from "@auxano/shared";
import { decimalToNumber } from "@auxano/shared";
import { canViewStrategy } from "./strategy-access";

export async function listMarketplaceStrategies(params: {
  category?: string;
  userId?: string;
  search?: string;
}): Promise<MarketplaceStrategy[]> {
  const where: Record<string, unknown> = {
    visibility: "PUBLIC",
    isPublished: true,
  };

  if (
    params.category &&
    params.category !== "ALL" &&
    Object.values(StrategyCategory).includes(
      params.category as StrategyCategory
    )
  ) {
    where.category = params.category;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const strategies = await prisma.strategy.findMany({
    where: {
      ...where,
      creator: {
        username: { not: "alexchen" },
      },
      slug: { not: { startsWith: "default-" } },
    },
    include: {
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { quantScore: "desc" },
    take: 50,
  });

  let following = new Set<string>();
  let liked = new Set<string>();
  let saved = new Set<string>();

  if (params.userId) {
    const [f, l, s] = await Promise.all([
      prisma.strategyFollow.findMany({
        where: { userId: params.userId },
        select: { strategyId: true },
      }),
      prisma.strategyLike.findMany({
        where: { userId: params.userId },
        select: { strategyId: true },
      }),
      prisma.savedStrategy.findMany({
        where: { userId: params.userId },
        select: { strategyId: true },
      }),
    ]);
    following = new Set(f.map((x) => x.strategyId));
    liked = new Set(l.map((x) => x.strategyId));
    saved = new Set(s.map((x) => x.strategyId));
  }

  return strategies.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    riskRating: s.riskRating,
    creator: {
      ...s.creator,
      name: s.creator.name ?? "Anonymous",
    },
    historicalReturn: s.historicalReturn
      ? decimalToNumber(s.historicalReturn)
      : null,
    sharpeRatio: s.sharpeRatio ? decimalToNumber(s.sharpeRatio) : null,
    volatilityScore: s.volatilityScore
      ? decimalToNumber(s.volatilityScore)
      : null,
    winRate: s.winRate ? decimalToNumber(s.winRate) : null,
    maxDrawdown: s.maxDrawdown ? decimalToNumber(s.maxDrawdown) : null,
    quantScore: s.quantScore,
    followerCount: s.followerCount,
    likeCount: s.likeCount,
    visibility: s.visibility,
    isFollowing: following.has(s.id),
    isLiked: liked.has(s.id),
    isSaved: saved.has(s.id),
  }));
}

export async function getStrategyBySlug(slug: string, userId?: string) {
  const strategy = await prisma.strategy.findUnique({
    where: { slug },
    include: {
      creator: true,
      comments: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      backtests: {
        include: { result: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!strategy) return null;

  const allowed = await canViewStrategy({
    strategy: {
      creatorId: strategy.creatorId,
      visibility: strategy.visibility,
      isPublished: strategy.isPublished,
    },
    viewerId: userId,
  });
  if (!allowed) return null;

  let isFollowing = false;
  let isLiked = false;
  let isSaved = false;
  if (userId) {
    const [f, l, s] = await Promise.all([
      prisma.strategyFollow.findUnique({
        where: { userId_strategyId: { userId, strategyId: strategy.id } },
      }),
      prisma.strategyLike.findUnique({
        where: { userId_strategyId: { userId, strategyId: strategy.id } },
      }),
      prisma.savedStrategy.findUnique({
        where: { userId_strategyId: { userId, strategyId: strategy.id } },
      }),
    ]);
    isFollowing = !!f;
    isLiked = !!l;
    isSaved = !!s;
  }

  return { ...strategy, isFollowing, isLiked, isSaved };
}
