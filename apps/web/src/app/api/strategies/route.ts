import { NextResponse } from "next/server";
import { requireDbUser, getOrCreateDbUser } from "@/lib/auth";
import { listMarketplaceStrategies } from "@/lib/services/strategies";
import { prisma } from "@auxano/database";
import { runBacktest, backtestToQuantScore } from "@auxano/shared";
import type { StrategyLogic } from "@auxano/shared";
import { toJsonValue } from "@/lib/json";
import {
  parseVisibility,
  visibilityToIsPublic,
} from "@/lib/services/strategy-access";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const user = await getOrCreateDbUser(req);

  const strategies = await listMarketplaceStrategies({
    category,
    search: search ?? undefined,
    userId: user?.id,
  });

  return NextResponse.json({ strategies });
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const logic = (body.logicJson ?? { nodes: [], edges: [] }) as StrategyLogic;
    const testSymbol =
      logic.meta?.symbols?.[0] ??
      (body.symbol as string | undefined) ??
      "SPY";

    const slug = (body.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const quote = await prisma.marketQuote.findUnique({
      where: { symbol: testSymbol.toUpperCase() },
    });
    const basePrice = quote ? Number(quote.price) : 100;

    const metrics = runBacktest({
      symbol: testSymbol.toUpperCase(),
      basePrice,
      days: 252,
      logic,
    });
    const quant = backtestToQuantScore(metrics);

    const visibility = parseVisibility(
      body.visibility ?? body.isPublic,
      "PUBLIC"
    );

    const strategy = await prisma.strategy.create({
      data: {
        creatorId: user.id,
        name: body.name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: body.description ?? "",
        category: body.category ?? "BALANCED",
        riskRating: body.riskRating ?? "MEDIUM",
        logicJson: toJsonValue(logic),
        visibility,
        isPublic: visibilityToIsPublic(visibility),
        isPublished: body.isPublished ?? true,
        historicalReturn: metrics.annualReturn,
        sharpeRatio: metrics.sharpeRatio,
        winRate: metrics.winRate,
        maxDrawdown: metrics.maxDrawdown,
        quantScore: quant.total,
      },
    });

    return NextResponse.json({ strategy });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
