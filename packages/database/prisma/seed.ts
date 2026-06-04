import { PrismaClient, StrategyCategory, RiskRating } from "@prisma/client";
import {
  DEFAULT_SYMBOLS,
  generatePriceSeries,
  runBacktest,
  backtestToQuantScore,
} from "@auxano/shared";

const prisma = new PrismaClient();

const SAMPLE_STRATEGIES = [
  {
    name: "Golden Cross Momentum",
    slug: "golden-cross-momentum",
    description:
      "Captures trend reversals when the 50-day moving average crosses above the 200-day MA. Designed for medium-term momentum exposure with disciplined risk controls.",
    category: StrategyCategory.MOMENTUM,
    riskRating: RiskRating.MEDIUM,
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition" as const,
          label: "MA Cross",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition" as const,
          label: "Take Profit",
          data: { indicator: "PROFIT", operator: ">", threshold: 15, action: "SELL" },
          position: { x: 200, y: 0 },
        },
      ],
      edges: [{ id: "e1", source: "1", target: "2" }],
    },
  },
  {
    name: "RSI Mean Reversion",
    slug: "rsi-mean-reversion",
    description:
      "Buys oversold conditions when RSI drops below 30 and exits on recovery. Classic mean-reversion approach for range-bound markets.",
    category: StrategyCategory.MEAN_REVERSION,
    riskRating: RiskRating.LOW,
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition" as const,
          label: "RSI Oversold",
          data: { indicator: "RSI", operator: "<", threshold: 30, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition" as const,
          label: "RSI Overbought",
          data: { indicator: "RSI", operator: ">", threshold: 70, action: "SELL" },
          position: { x: 200, y: 0 },
        },
      ],
      edges: [],
    },
  },
  {
    name: "Conservative Dividend Growth",
    slug: "conservative-dividend-growth",
    description:
      "Low-volatility strategy focused on capital preservation with modest growth targets. Suitable for conservative investors.",
    category: StrategyCategory.CONSERVATIVE,
    riskRating: RiskRating.LOW,
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition" as const,
          label: "Entry",
          data: { indicator: "RSI", operator: "<", threshold: 40, action: "BUY" },
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
    },
  },
  {
    name: "Aggressive Tech Momentum",
    slug: "aggressive-tech-momentum",
    description:
      "High-conviction momentum plays in technology leaders. Higher drawdown tolerance for superior upside capture.",
    category: StrategyCategory.AGGRESSIVE,
    riskRating: RiskRating.VERY_HIGH,
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition" as const,
          label: "Momentum Entry",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition" as const,
          label: "Quick Exit",
          data: { indicator: "PROFIT", operator: ">", threshold: 8, action: "SELL" },
          position: { x: 200, y: 0 },
        },
      ],
      edges: [],
    },
  },
  {
    name: "Value Accumulation",
    slug: "value-accumulation",
    description:
      "Systematic accumulation during pullbacks. Aligns with long-term value investing principles.",
    category: StrategyCategory.VALUE,
    riskRating: RiskRating.MEDIUM,
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition" as const,
          label: "Pullback Buy",
          data: { indicator: "RSI", operator: "<", threshold: 35, action: "BUY" },
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
    },
  },
  {
    name: "Balanced Multi-Factor",
    slug: "balanced-multi-factor",
    description:
      "Combines momentum and mean-reversion signals for balanced risk-adjusted returns across market regimes.",
    category: StrategyCategory.BALANCED,
    riskRating: RiskRating.MEDIUM,
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition" as const,
          label: "Dual Signal",
          data: { indicator: "RSI", operator: "<", threshold: 45, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition" as const,
          label: "Exit",
          data: { indicator: "PROFIT", operator: ">", threshold: 12, action: "SELL" },
          position: { x: 200, y: 0 },
        },
      ],
      edges: [],
    },
  },
];

async function main() {
  console.log("Seeding market quotes...");
  for (const s of DEFAULT_SYMBOLS) {
    const changePct = (Math.random() - 0.5) * 4;
    const price = s.basePrice * (1 + changePct / 100);
    await prisma.marketQuote.upsert({
      where: { symbol: s.symbol },
      create: {
        symbol: s.symbol,
        name: s.name,
        price,
        change: price - s.basePrice,
        changePct,
        sector: s.sector,
        high52: price * 1.15,
        low52: price * 0.85,
        volume: BigInt(Math.floor(Math.random() * 50_000_000)),
      },
      update: {
        price,
        change: price - s.basePrice,
        changePct,
      },
    });

    const history = generatePriceSeries(s.symbol, s.basePrice, 252);
    for (const bar of history) {
      await prisma.priceHistory.upsert({
        where: {
          symbol_date: { symbol: s.symbol, date: new Date(bar.date) },
        },
        create: {
          symbol: s.symbol,
          date: new Date(bar.date),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: BigInt(Math.floor(Math.random() * 10_000_000)),
        },
        update: {
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        },
      });
    }
  }

  const demoClerkId = "user_demo_auxano_seed";
  const demoUser = await prisma.user.upsert({
    where: { clerkId: demoClerkId },
    create: {
      clerkId: demoClerkId,
      email: "demo@auxano.app",
      name: "Alex Chen",
      username: "alexchen",
      investingExperience: "ADVANCED",
      riskTolerance: "MODERATE",
      financialGoal: "WEALTH_BUILDING",
      onboardingComplete: true,
      avatarUrl: null,
    },
    update: {},
  });

  await prisma.paperAccount.upsert({
    where: { userId: demoUser.id },
    create: { userId: demoUser.id },
    update: {},
  });

  console.log("Seeding marketplace strategies...");
  for (const strat of SAMPLE_STRATEGIES) {
    const metrics = runBacktest({
      symbol: "AAPL",
      basePrice: 178.5,
      days: 252,
      logic: strat.logic,
    });
    const quant = backtestToQuantScore(metrics);

    await prisma.strategy.upsert({
      where: { slug: strat.slug },
      create: {
        creatorId: demoUser.id,
        name: strat.name,
        slug: strat.slug,
        description: strat.description,
        category: strat.category,
        riskRating: strat.riskRating,
        isPublic: true,
        isPublished: true,
        logicJson: strat.logic,
        historicalReturn: metrics.annualReturn,
        sharpeRatio: metrics.sharpeRatio,
        volatilityScore: 18 + Math.random() * 12,
        winRate: metrics.winRate,
        maxDrawdown: metrics.maxDrawdown,
        quantScore: quant.total,
        followerCount: Math.floor(Math.random() * 500) + 50,
        likeCount: Math.floor(Math.random() * 300) + 20,
      },
      update: {
        historicalReturn: metrics.annualReturn,
        sharpeRatio: metrics.sharpeRatio,
        winRate: metrics.winRate,
        maxDrawdown: metrics.maxDrawdown,
        quantScore: quant.total,
        logicJson: strat.logic,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
