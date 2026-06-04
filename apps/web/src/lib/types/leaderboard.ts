export type LeaderboardTrader = {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  portfolioValue: number;
  returnPct: number;
  cashBalance: number;
  positionsValue: number;
  rank: number;
};

export type LeaderboardPayload = {
  refreshedAt: string;
  topStrategies: {
    id: string;
    name: string;
    slug: string;
    quantScore: number;
    creator: { name: string | null; username: string | null; avatarUrl: string | null };
    historicalReturn: number;
  }[];
  topCreators: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    score: number;
    followers: number;
    strategyCount: number;
    rank: number;
  }[];
  topTraders: LeaderboardTrader[];
};
