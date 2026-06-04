import type { StrategyLogic } from "./types";
import { logicWithMeta } from "./strategy-meta";
import {
  runPresetYearBacktest,
  formatPresetMarketMetrics,
} from "./preset-backtest";

export const DEFAULT_ALGO_CREATOR = {
  name: "DEFAULT",
  username: "default",
} as const;

export interface PresetAlgorithm {
  id: string;
  name: string;
  tagline: string;
  difficulty: "Beginner" | "Easy" | "Moderate" | "Advanced";
  description: string;
  whoItsFor: string;
  category: string;
  riskRating: string;
  logic: StrategyLogic;
  suggestedSymbols: string[];
  backtest: {
    annualReturnPct: number;
    sharpeRatio: number;
    winRatePct: number;
    maxDrawdownPct: number;
    quantScore: number;
    totalTrades: number;
    backtestSymbol: string;
    backtestDays: number;
  };
}

function buildPreset(
  base: Omit<PresetAlgorithm, "backtest" | "logic"> & { logic: StrategyLogic }
): PresetAlgorithm {
  const { metrics, quantScore, backtestSymbol } = runPresetYearBacktest(
    base.logic,
    base.logic.meta?.symbolScope === "universal"
      ? ["SPY", "QQQ", "DIA", "AAPL", "MSFT"]
      : base.suggestedSymbols
  );
  const formatted = formatPresetMarketMetrics(metrics);
  return {
    ...base,
    backtest: {
      annualReturnPct: formatted.historicalReturn,
      sharpeRatio: formatted.sharpeRatio,
      winRatePct: formatted.winRate,
      maxDrawdownPct: formatted.maxDrawdown,
      quantScore,
      totalTrades: formatted.totalTrades,
      backtestSymbol,
      backtestDays: 252,
    },
  };
}

const PRESET_BASE = [
  {
    id: "steady-grower",
    name: "Steady Grower",
    tagline: "Quality dips + disciplined exits",
    difficulty: "Beginner" as const,
    description:
      "Combines RSI dip-buying with volume confirmation, 10% profit targets, and a 4% stop-loss. Designed for lower drawdowns on large-cap names.",
    whoItsFor: "Beginners who want fewer whipsaws than pure momentum.",
    category: "CONSERVATIVE",
    riskRating: "LOW",
    suggestedSymbols: ["AAPL", "JNJ", "V", "MSFT"],
    logic: logicWithMeta(
      [
        {
          id: "1",
          type: "condition",
          label: "RSI dip + volume",
          data: { indicator: "RSI", operator: "<", threshold: 38, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Volume confirm",
          data: { indicator: "VOLUME", operator: ">", threshold: 1.1, action: "BUY" },
          position: { x: 0, y: 40 },
        },
        {
          id: "3",
          type: "condition",
          label: "Take profit 10%",
          data: { indicator: "PROFIT", operator: ">", threshold: 10, action: "SELL" },
          position: { x: 0, y: 80 },
        },
        {
          id: "4",
          type: "condition",
          label: "Stop loss 4%",
          data: { indicator: "STOP_LOSS", operator: ">", threshold: 4, action: "SELL" },
          position: { x: 0, y: 120 },
        },
      ],
      [],
      { symbolScope: "symbols", symbols: ["AAPL", "JNJ", "V", "MSFT"], builderMode: "blocks" }
    ),
    symbol: "AAPL",
    price: 178,
  },
  {
    id: "trend-rider",
    name: "Trend Rider Pro",
    tagline: "Golden cross with trailing protection",
    difficulty: "Easy" as const,
    description:
      "Enters on golden-cross momentum, exits on 14% profit or 5% trailing stop from highs. Strong in sustained tech uptrends.",
    whoItsFor: "Trend followers trading NVDA, MSFT, META.",
    category: "MOMENTUM",
    riskRating: "MEDIUM",
    suggestedSymbols: ["NVDA", "MSFT", "META"],
    logic: logicWithMeta(
      [
        {
          id: "1",
          type: "condition",
          label: "Golden cross",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Profit 14%",
          data: { indicator: "PROFIT", operator: ">", threshold: 14, action: "SELL" },
          position: { x: 0, y: 80 },
        },
        {
          id: "3",
          type: "condition",
          label: "Trail 5%",
          data: { indicator: "TRAILING_STOP", operator: ">", threshold: 5, action: "SELL" },
          position: { x: 0, y: 120 },
        },
      ],
      [{ id: "e1", source: "1", target: "2" }],
      { symbolScope: "symbols", symbols: ["NVDA", "MSFT", "META"], builderMode: "blocks" }
    ),
    symbol: "NVDA",
    price: 480,
  },
  {
    id: "bounce-back",
    name: "Bounce Back Elite",
    tagline: "Mean reversion with risk cap",
    difficulty: "Easy" as const,
    description:
      "Buys deep oversold RSI, sells on recovery or 12% gain, with 6% stop-loss. Classic mean reversion tuned for mega-cap tech.",
    whoItsFor: "Range-bound markets and patient traders.",
    category: "MEAN_REVERSION",
    riskRating: "MEDIUM",
    suggestedSymbols: ["GOOGL", "AMZN", "TSLA"],
    logic: logicWithMeta(
      [
        {
          id: "1",
          type: "condition",
          label: "Deep oversold",
          data: { indicator: "RSI", operator: "<", threshold: 28, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Recovery sell",
          data: { indicator: "RSI", operator: ">", threshold: 62, action: "SELL" },
          position: { x: 0, y: 80 },
        },
        {
          id: "3",
          type: "condition",
          label: "Profit 12%",
          data: { indicator: "PROFIT", operator: ">", threshold: 12, action: "SELL" },
          position: { x: 0, y: 120 },
        },
        {
          id: "4",
          type: "condition",
          label: "Stop 6%",
          data: { indicator: "STOP_LOSS", operator: ">", threshold: 6, action: "SELL" },
          position: { x: 0, y: 160 },
        },
      ],
      [],
      { symbolScope: "symbols", symbols: ["GOOGL", "AMZN", "TSLA"], builderMode: "blocks" }
    ),
    symbol: "GOOGL",
    price: 140,
  },
  {
    id: "quick-sprinter",
    name: "Quick Sprinter",
    tagline: "High-activity momentum scalper",
    difficulty: "Moderate" as const,
    description:
      "Fast momentum entries with 7% profit targets and 3% trailing stops. Higher trade count — best for learning execution frequency.",
    whoItsFor: "Users comfortable with volatility and active paper trading.",
    category: "AGGRESSIVE",
    riskRating: "HIGH",
    suggestedSymbols: ["NVDA", "TSLA", "META"],
    logic: logicWithMeta(
      [
        {
          id: "1",
          type: "condition",
          label: "Momentum",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Volume surge",
          data: { indicator: "VOLUME", operator: ">", threshold: 1.35, action: "BUY" },
          position: { x: 0, y: 40 },
        },
        {
          id: "3",
          type: "condition",
          label: "Quick profit 7%",
          data: { indicator: "PROFIT", operator: ">", threshold: 7, action: "SELL" },
          position: { x: 0, y: 80 },
        },
        {
          id: "4",
          type: "condition",
          label: "Trail 3%",
          data: { indicator: "TRAILING_STOP", operator: ">", threshold: 3, action: "SELL" },
          position: { x: 0, y: 120 },
        },
      ],
      [],
      { symbolScope: "symbols", symbols: ["NVDA", "TSLA", "META"], builderMode: "blocks" }
    ),
    symbol: "NVDA",
    price: 480,
  },
  {
    id: "index-guardian",
    name: "Index Guardian",
    tagline: "Broad market trend system",
    difficulty: "Beginner" as const,
    description:
      "Universal ETF/index strategy: golden cross entries, death cross exits, 8% profit cap. Works on SPY, QQQ, DIA.",
    whoItsFor: "Set-and-forget index investors.",
    category: "BALANCED",
    riskRating: "LOW",
    suggestedSymbols: ["SPY", "QQQ", "DIA"],
    logic: logicWithMeta(
      [
        {
          id: "1",
          type: "condition",
          label: "Trend on",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Trend off",
          data: { indicator: "MA_CROSS", operator: "<", action: "SELL" },
          position: { x: 0, y: 80 },
        },
        {
          id: "3",
          type: "condition",
          label: "Profit 8%",
          data: { indicator: "PROFIT", operator: ">", threshold: 8, action: "SELL" },
          position: { x: 0, y: 120 },
        },
      ],
      [],
      {
        symbolScope: "universal",
        symbols: [],
        builderMode: "blocks",
      }
    ),
    symbol: "SPY",
    price: 450,
  },
  {
    id: "copper-compass",
    name: "Copper Compass",
    tagline: "Balanced swing on quality names",
    difficulty: "Moderate" as const,
    description:
      "Blends RSI pullbacks with trend confirmation and 9% profit targets. One-year backtest tuned on large-cap leaders.",
    whoItsFor: "Investors wanting balanced growth without index-only exposure.",
    category: "GROWTH",
    riskRating: "MEDIUM",
    suggestedSymbols: ["AAPL", "MSFT", "V"],
    logic: logicWithMeta(
      [
        {
          id: "1",
          type: "condition",
          label: "Pullback entry",
          data: { indicator: "RSI", operator: "<", threshold: 42, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Trend filter",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 40 },
        },
        {
          id: "3",
          type: "condition",
          label: "Profit 9%",
          data: { indicator: "PROFIT", operator: ">", threshold: 9, action: "SELL" },
          position: { x: 0, y: 80 },
        },
        {
          id: "4",
          type: "condition",
          label: "Stop 5%",
          data: { indicator: "STOP_LOSS", operator: ">", threshold: 5, action: "SELL" },
          position: { x: 0, y: 120 },
        },
      ],
      [],
      { symbolScope: "symbols", symbols: ["AAPL", "MSFT", "V"], builderMode: "blocks" }
    ),
    symbol: "AAPL",
    price: 178,
  },
];

export const PRESET_ALGORITHMS: PresetAlgorithm[] = PRESET_BASE.map((p) =>
  buildPreset({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    difficulty: p.difficulty,
    description: p.description,
    whoItsFor: p.whoItsFor,
    category: p.category,
    riskRating: p.riskRating,
    suggestedSymbols: p.suggestedSymbols,
    logic: p.logic,
  })
);

/** Public marketplace cards for the 6 built-in algorithms */
export function listDefaultMarketplaceAlgos() {
  return PRESET_ALGORITHMS.map((p) => ({
    id: p.id,
    slug: `default-${p.id}`,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    whoItsFor: p.whoItsFor,
    category: p.category,
    riskRating: p.riskRating,
    difficulty: p.difficulty,
    isPreset: true as const,
    isDefault: true as const,
    creator: {
      id: "default",
      name: DEFAULT_ALGO_CREATOR.name,
      username: DEFAULT_ALGO_CREATOR.username,
      avatarUrl: null,
    },
    historicalReturn: p.backtest.annualReturnPct,
    sharpeRatio: p.backtest.sharpeRatio,
    winRate: p.backtest.winRatePct,
    maxDrawdown: p.backtest.maxDrawdownPct,
    quantScore: p.backtest.quantScore,
    totalTrades: p.backtest.totalTrades,
    backtestSymbol: p.backtest.backtestSymbol,
    backtestDays: p.backtest.backtestDays,
    symbolScope: p.logic.meta?.symbolScope ?? "symbols",
    allowedSymbols:
      p.logic.meta?.symbolScope === "universal" ? [] : p.suggestedSymbols,
    followerCount: 0,
    likeCount: 0,
  }));
}

export function getPresetById(id: string): PresetAlgorithm | undefined {
  return PRESET_ALGORITHMS.find((p) => p.id === id);
}
