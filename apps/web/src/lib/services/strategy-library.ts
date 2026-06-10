import { prisma } from "@auxano/database";
import type { StrategyLogic } from "@auxano/shared";
import { runBacktest, backtestToQuantScore } from "@auxano/shared";
import { decimalToNumber } from "@auxano/shared";
import {
  areFriends,
  canViewStrategy,
  parseVisibility,
  visibilityToIsPublic,
  type StrategyVisibilityInput,
} from "./strategy-access";

export async function deleteUserStrategy(strategyId: string, userId: string) {
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy) throw new Error("Strategy not found");
  if (strategy.creatorId !== userId) throw new Error("Not allowed");
  if (strategy.slug.startsWith("preset-")) {
    throw new Error("Preset deployments cannot be deleted here — remove from Bots");
  }
  await prisma.strategy.delete({ where: { id: strategyId } });
  return { ok: true };
}

export async function duplicateUserStrategy(strategyId: string, userId: string) {
  const source = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!source) throw new Error("Strategy not found");
  if (source.creatorId !== userId) throw new Error("Not allowed");

  const baseSlug = source.slug.replace(/-copy-[a-z0-9]+$/i, "").slice(0, 40);
  const slug = `${baseSlug}-copy-${Date.now().toString(36)}`;

  const logic = source.logicJson as unknown as StrategyLogic;
  const symbol = logic.meta?.symbols?.[0] ?? "SPY";
  const quote = await prisma.marketQuote.findUnique({
    where: { symbol: symbol.toUpperCase() },
  });
  const basePrice = quote ? decimalToNumber(quote.price) : 100;
  const metrics = runBacktest({
    symbol: symbol.toUpperCase(),
    basePrice,
    days: 252,
    logic,
  });
  const quant = backtestToQuantScore(metrics);

  const copy = await prisma.strategy.create({
    data: {
      creatorId: userId,
      name: `${source.name} (copy)`,
      slug,
      description: source.description,
      category: source.category,
      riskRating: source.riskRating,
      logicJson: source.logicJson as object,
      visibility: "PRIVATE",
      isPublic: false,
      isPublished: true,
      historicalReturn: metrics.annualReturn,
      sharpeRatio: metrics.sharpeRatio,
      winRate: metrics.winRate,
      maxDrawdown: metrics.maxDrawdown,
      quantScore: quant.total,
    },
  });

  return copy;
}

export async function updateStrategyMeta(
  strategyId: string,
  userId: string,
  patch: {
    visibility?: StrategyVisibilityInput;
    name?: string;
    description?: string;
  }
) {
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy) throw new Error("Strategy not found");
  if (strategy.creatorId !== userId) throw new Error("Not allowed");

  const visibility = patch.visibility
    ? parseVisibility(patch.visibility)
    : undefined;

  return prisma.strategy.update({
    where: { id: strategyId },
    data: {
      ...(patch.name?.trim() ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description.trim() }
        : {}),
      ...(visibility
        ? {
            visibility,
            isPublic: visibilityToIsPublic(visibility),
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      visibility: true,
      isPublic: true,
      quantScore: true,
    },
  });
}

export async function listCreatorStrategies(
  creatorId: string,
  viewerId?: string
) {
  const strategies = await prisma.strategy.findMany({
    where: {
      creatorId,
      ...(viewerId === creatorId
        ? {}
        : { isPublished: true }),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      quantScore: true,
      category: true,
      visibility: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      creatorId: true,
    },
  });

  let friend = false;
  if (viewerId && viewerId !== creatorId) {
    friend = await areFriends(viewerId, creatorId);
  }

  const visible = [];
  for (const s of strategies) {
    if (
      await canViewStrategy({
        strategy: s,
        viewerId,
        isFriend: friend,
      })
    ) {
      visible.push(s);
    }
  }

  return visible.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    quantScore: s.quantScore,
    category: s.category,
    visibility: s.visibility,
    isPublished: s.isPublished,
    isOwner: viewerId === creatorId,
  }));
}
