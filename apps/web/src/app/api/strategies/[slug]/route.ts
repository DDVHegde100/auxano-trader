import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { getStrategyBySlug } from "@/lib/services/strategies";
import { decimalToNumber } from "@auxano/shared";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getOrCreateDbUser(req);
  const strategy = await getStrategyBySlug(slug, user?.id);

  if (!strategy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...strategy,
    historicalReturn: strategy.historicalReturn
      ? decimalToNumber(strategy.historicalReturn)
      : null,
    sharpeRatio: strategy.sharpeRatio
      ? decimalToNumber(strategy.sharpeRatio)
      : null,
    winRate: strategy.winRate ? decimalToNumber(strategy.winRate) : null,
    maxDrawdown: strategy.maxDrawdown
      ? decimalToNumber(strategy.maxDrawdown)
      : null,
  });
}
