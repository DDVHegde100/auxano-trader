import { NextResponse } from "next/server";
import { PRESET_ALGORITHMS } from "@auxano/shared";
import { runBacktest, rateAlgorithmLayman } from "@auxano/shared";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function GET() {
  const presets = await Promise.all(
    PRESET_ALGORITHMS.map(async (preset) => {
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

      return {
        ...preset,
        logic: preset.logic,
        preview: {
          laymanScore: layman.score,
          grade: layman.grade,
          headline: layman.headline,
          annualReturn: metrics.annualReturn,
          winRate: metrics.winRate,
          maxDrawdown: metrics.maxDrawdown,
        },
      };
    })
  );

  return NextResponse.json({ presets });
}
