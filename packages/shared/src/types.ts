export type StrategyBlockType =
  | "condition"
  | "action"
  | "indicator"
  | "logic_gate";

export interface StrategyNode {
  id: string;
  type: StrategyBlockType;
  label: string;
  data: Record<string, string | number | boolean>;
  position: { x: number; y: number };
}

export interface StrategyEdge {
  id: string;
  source: string;
  target: string;
}

export interface StrategyLogic {
  nodes: StrategyNode[];
  edges: StrategyEdge[];
}

export interface EquityPoint {
  date: string;
  value: number;
  benchmark?: number;
}

export interface BacktestMetrics {
  annualReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  equityCurve: EquityPoint[];
  benchmarkCurve: EquityPoint[];
  tradeLog: TradeLogEntry[];
}

export interface TradeLogEntry {
  date: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  pnl?: number;
}

export interface QuantScoreBreakdown {
  total: number;
  consistency: number;
  riskManagement: number;
  drawdown: number;
  returns: number;
  volatility: number;
  sharpe: number;
}

export interface PortfolioSummary {
  portfolioValue: number;
  cashBalance: number;
  positionsValue: number;
  todayPnl: number;
  todayPnlPct: number;
  totalReturn: number;
  totalReturnPct: number;
  realizedPnl: number;
  unrealizedPnl: number;
  activeStrategies: number;
}

export interface PositionView {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  weight: number;
}

export interface DashboardData {
  summary: PortfolioSummary;
  performance: EquityPoint[];
  allocation: { label: string; value: number; color: string }[];
  recentTrades: {
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    executedAt: string;
  }[];
}

export interface MarketplaceStrategy {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  riskRating: string;
  creator: { id: string; name: string; username: string | null; avatarUrl: string | null };
  historicalReturn: number | null;
  sharpeRatio: number | null;
  volatilityScore: number | null;
  winRate: number | null;
  maxDrawdown: number | null;
  quantScore: number;
  followerCount: number;
  likeCount: number;
  isFollowing?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
}

export type OnboardingPayload = {
  name: string;
  username: string;
  investingExperience: string;
  riskTolerance: string;
  financialGoal: string;
};
