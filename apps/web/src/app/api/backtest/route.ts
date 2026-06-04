import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { runBacktest, backtestToQuantScore } from "@auxano/shared";
import type { StrategyLogic } from "@auxano/shared";
import { toJsonValue } from "@/lib/json";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const logic = body.logicJson as StrategyLogic;
    const symbol = body.symbol ?? "AAPL";
    const days = body.days ?? 252;

    const quote = await prisma.marketQuote.findUnique({
      where: { symbol },
    });
    const basePrice = quote ? parseFloat(quote.price.toString()) : 178.5;

    const metrics = runBacktest({ symbol, basePrice, days, logic });
    const quant = backtestToQuantScore(metrics);

    const backtest = await prisma.backtest.create({
      data: {
        userId: user.id,
        strategyId: body.strategyId,
        name: body.name ?? `Backtest ${symbol}`,
        symbols: [symbol],
        startDate: new Date(Date.now() - days * 86400000),
        endDate: new Date(),
        logicJson: toJsonValue(logic),
        status: "COMPLETED",
        completedAt: new Date(),
        result: {
          create: {
            annualReturn: metrics.annualReturn,
            sharpeRatio: metrics.sharpeRatio,
            sortinoRatio: metrics.sortinoRatio,
            maxDrawdown: metrics.maxDrawdown,
            winRate: metrics.winRate,
            profitFactor: metrics.profitFactor,
            totalTrades: metrics.totalTrades,
            equityCurve: toJsonValue(metrics.equityCurve),
            benchmarkCurve: toJsonValue(metrics.benchmarkCurve),
            tradeLog: toJsonValue(metrics.tradeLog),
          },
        },
      },
      include: { result: true },
    });

    return NextResponse.json({ backtest, metrics, quantScore: quant });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Backtest failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
