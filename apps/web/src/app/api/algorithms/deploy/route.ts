import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import {
  getPresetById,
  runBacktest,
  backtestToQuantScore,
  rateAlgorithmLayman,
} from "@auxano/shared";
import { decimalToNumber } from "@auxano/shared";
import { toJsonValue } from "@/lib/json";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const { presetId, allocated = 10000 } = await req.json();

    const preset = getPresetById(presetId);
    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const symbol = preset.suggestedSymbols[0] ?? "AAPL";
    const quote = await prisma.marketQuote.findUnique({ where: { symbol } });
    const basePrice = quote ? decimalToNumber(quote.price) : 100;

    const metrics = runBacktest({
      symbol,
      basePrice,
      days: 252,
      logic: preset.logic,
    });
    const quant = backtestToQuantScore(metrics);
    const layman = rateAlgorithmLayman(metrics);

    const slug = `preset-${preset.id}-${user.id.slice(0, 6)}`;

    const strategy = await prisma.strategy.upsert({
      where: { slug },
      create: {
        creatorId: user.id,
        name: preset.name,
        slug,
        description: preset.description,
        category: preset.category as "CONSERVATIVE",
        riskRating: preset.riskRating as "LOW",
        logicJson: toJsonValue(preset.logic),
        isPublic: false,
        isPublished: true,
        historicalReturn: metrics.annualReturn,
        sharpeRatio: metrics.sharpeRatio,
        winRate: metrics.winRate,
        maxDrawdown: metrics.maxDrawdown,
        quantScore: quant.total,
      },
      update: {
        historicalReturn: metrics.annualReturn,
        quantScore: quant.total,
        logicJson: toJsonValue(preset.logic),
      },
    });

    await prisma.strategyDeployment.upsert({
      where: {
        strategyId_userId: { strategyId: strategy.id, userId: user.id },
      },
      create: {
        strategyId: strategy.id,
        userId: user.id,
        isActive: true,
        allocated,
      },
      update: { isActive: true, allocated },
    });

    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { deployedCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      strategy: { id: strategy.id, slug: strategy.slug, name: strategy.name },
      layman,
      metrics,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Deploy failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
