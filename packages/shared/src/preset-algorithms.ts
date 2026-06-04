import type { StrategyLogic } from "./types";

export interface PresetAlgorithm {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  difficulty: "Beginner" | "Easy" | "Moderate";
  description: string;
  whoItsFor: string;
  category: string;
  riskRating: string;
  logic: StrategyLogic;
  suggestedSymbols: string[];
}

export const PRESET_ALGORITHMS: PresetAlgorithm[] = [
  {
    id: "steady-grower",
    name: "Steady Grower",
    tagline: "Buy dips, sell small wins",
    emoji: "🌱",
    difficulty: "Beginner",
    description:
      "Waits for stocks to look temporarily oversold (RSI below 40), buys, then sells when up about 8%. Built for calm, consistent paper-trading practice.",
    whoItsFor: "First-time algo traders who want low drama.",
    category: "CONSERVATIVE",
    riskRating: "LOW",
    suggestedSymbols: ["AAPL", "JNJ", "V"],
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition",
          label: "Gentle dip buy",
          data: { indicator: "RSI", operator: "<", threshold: 40, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Take profit",
          data: { indicator: "PROFIT", operator: ">", threshold: 8, action: "SELL" },
          position: { x: 0, y: 80 },
        },
      ],
      edges: [{ id: "e1", source: "1", target: "2" }],
    },
  },
  {
    id: "trend-rider",
    name: "Trend Rider",
    tagline: "Ride the wave when trends turn up",
    emoji: "🏄",
    difficulty: "Easy",
    description:
      "Enters when the 50-day average crosses above the 200-day (classic golden cross), exits after ~12% gain. Popular momentum starter strategy.",
    whoItsFor: "Users who believe in following the trend.",
    category: "MOMENTUM",
    riskRating: "MEDIUM",
    suggestedSymbols: ["NVDA", "MSFT", "META"],
    logic: {
      nodes: [
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
          label: "Profit exit",
          data: { indicator: "PROFIT", operator: ">", threshold: 12, action: "SELL" },
          position: { x: 0, y: 80 },
        },
      ],
      edges: [{ id: "e1", source: "1", target: "2" }],
    },
  },
  {
    id: "bounce-back",
    name: "Bounce Back",
    tagline: "Buy fear, sell relief",
    emoji: "⚡",
    difficulty: "Easy",
    description:
      "Classic mean-reversion: buys when RSI drops below 30 (oversold) and sells when RSI rises above 65 or profit hits 10%.",
    whoItsFor: "Range-bound markets and patient traders.",
    category: "MEAN_REVERSION",
    riskRating: "MEDIUM",
    suggestedSymbols: ["GOOGL", "AMZN", "TSLA"],
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition",
          label: "Oversold buy",
          data: { indicator: "RSI", operator: "<", threshold: 30, action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Overbought sell",
          data: { indicator: "RSI", operator: ">", threshold: 65, action: "SELL" },
          position: { x: 0, y: 80 },
        },
      ],
      edges: [],
    },
  },
  {
    id: "quick-sprinter",
    name: "Quick Sprinter",
    tagline: "Fast in, fast out",
    emoji: "🚀",
    difficulty: "Moderate",
    description:
      "Aggressive momentum with quicker 6% profit targets. Higher activity — good for learning how often a strategy trades in backtests.",
    whoItsFor: "Users comfortable with more trades and volatility.",
    category: "AGGRESSIVE",
    riskRating: "HIGH",
    suggestedSymbols: ["NVDA", "TSLA", "META"],
    logic: {
      nodes: [
        {
          id: "1",
          type: "condition",
          label: "Momentum entry",
          data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "condition",
          label: "Quick take profit",
          data: { indicator: "PROFIT", operator: ">", threshold: 6, action: "SELL" },
          position: { x: 0, y: 80 },
        },
      ],
      edges: [],
    },
  },
];

export function getPresetById(id: string): PresetAlgorithm | undefined {
  return PRESET_ALGORITHMS.find((p) => p.id === id);
}
