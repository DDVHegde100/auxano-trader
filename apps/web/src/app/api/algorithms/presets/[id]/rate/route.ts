import { NextResponse } from "next/server";
import { getPresetById, runBacktest, rateAlgorithmLayman } from "@auxano/shared";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preset = getPresetById(id);
  if (!preset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const layman = rateAlgorithmLayman(metrics);

  return NextResponse.json({
    preset: { id: preset.id, name: preset.name },
    layman,
    metrics: {
      annualReturn: metrics.annualReturn,
      winRate: metrics.winRate,
      maxDrawdown: metrics.maxDrawdown,
      totalTrades: metrics.totalTrades,
    },
    equityCurve: metrics.equityCurve.slice(-40),
  });
}
