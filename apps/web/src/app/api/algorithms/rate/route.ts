import { NextResponse } from "next/server";
import {
  runBacktest,
  rateAlgorithmLayman,
  backtestToQuantScore,
} from "@auxano/shared";
import type { StrategyLogic } from "@auxano/shared";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";

export async function POST(req: Request) {
  const body = await req.json();
  const logic = (body.logicJson ?? { nodes: [], edges: [] }) as StrategyLogic;
  const symbol = (body.symbol ?? "AAPL").toUpperCase();
  const days = body.days ?? 252;

  const quote = await prisma.marketQuote.findUnique({ where: { symbol } });
  const basePrice = quote ? decimalToNumber(quote.price) : 178.5;

  const metrics = runBacktest({ symbol, basePrice, days, logic });
  const layman = rateAlgorithmLayman(metrics);
  const quant = backtestToQuantScore(metrics);

  return NextResponse.json({
    layman,
    quantScore: quant.total,
    metrics: {
      annualReturn: metrics.annualReturn,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      maxDrawdown: metrics.maxDrawdown,
      winRate: metrics.winRate,
      profitFactor: metrics.profitFactor,
      totalTrades: metrics.totalTrades,
    },
    equityCurve: metrics.equityCurve.slice(-60),
  });
}
