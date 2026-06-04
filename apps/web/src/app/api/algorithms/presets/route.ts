import { NextResponse } from "next/server";
import { listDefaultMarketplaceAlgos, rateAlgorithmLayman } from "@auxano/shared";
import { runPresetYearBacktest, formatPresetMarketMetrics } from "@auxano/shared";
import { getPresetById } from "@auxano/shared";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function GET() {
  const basePrices: Record<string, number> = {};
  const quotes = await prisma.marketQuote.findMany();
  for (const q of quotes) {
    basePrices[q.symbol] = decimalToNumber(q.price);
  }

  const presets = listDefaultMarketplaceAlgos().map((card) => {
    const preset = getPresetById(card.id)!;
    const symbols =
      preset.logic.meta?.symbolScope === "universal"
        ? ["SPY", "QQQ", "DIA", "AAPL", "MSFT"]
        : preset.suggestedSymbols;

    const { metrics, quantScore, backtestSymbol } = runPresetYearBacktest(
      preset.logic,
      symbols,
      basePrices
    );
    const formatted = formatPresetMarketMetrics(metrics);
    const layman = rateAlgorithmLayman(metrics);

    return {
      ...card,
      historicalReturn: formatted.historicalReturn,
      sharpeRatio: formatted.sharpeRatio,
      winRate: formatted.winRate,
      maxDrawdown: formatted.maxDrawdown,
      quantScore,
      totalTrades: formatted.totalTrades,
      backtestSymbol,
      preview: {
        laymanScore: layman.score,
        grade: layman.grade,
        headline: layman.headline,
        annualReturn: formatted.historicalReturn,
        winRate: formatted.winRate,
        maxDrawdown: formatted.maxDrawdown,
        sharpeRatio: formatted.sharpeRatio,
        backtestDays: 252,
      },
    };
  });

  return NextResponse.json({ presets });
}
