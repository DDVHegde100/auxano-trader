/** Rotating challenge definitions — selected by week/month index. */

export type CompetitionTemplateDef = {
  key: string;
  title: string;
  description: string;
  rules: string;
  rulesSummary: string;
  periodTypes: ("WEEKLY" | "MONTHLY")[];
  scopes: ("GLOBAL" | "FRIENDS")[];
  icon: string;
  sortOrder: number;
};

export const COMPETITION_TEMPLATES: CompetitionTemplateDef[] = [
  {
    key: "momentum-sprint",
    title: "Momentum Sprint",
    description: "Ride the trend — highest paper return wins this week.",
    rules:
      "Ranked by portfolio return % since your league baseline snapshot. Paper trading only. No leverage. Standard market hours logic applies to fills.",
    rulesSummary: "Highest 7-day return % wins",
    periodTypes: ["WEEKLY"],
    scopes: ["GLOBAL", "FRIENDS"],
    icon: "zap",
    sortOrder: 1,
  },
  {
    key: "friend-circle",
    title: "Friend Circle Showdown",
    description: "Only your crew on the leaderboard — prove it to people you know.",
    rules:
      "Friends-only standings. Return % measured from join baseline. Must be mutual friends on Auxano.",
    rulesSummary: "Friends-only weekly ranks",
    periodTypes: ["WEEKLY"],
    scopes: ["FRIENDS"],
    icon: "users",
    sortOrder: 2,
  },
  {
    key: "global-grand-prix",
    title: "Global Grand Prix",
    description: "The full Auxano field — top paper traders worldwide this week.",
    rules:
      "Open to all traders with public or league-visible profiles. Ranked by return % vs baseline at join.",
    rulesSummary: "Global weekly championship",
    periodTypes: ["WEEKLY"],
    scopes: ["GLOBAL"],
    icon: "globe",
    sortOrder: 3,
  },
  {
    key: "steady-growth",
    title: "Steady Growth Classic",
    description: "Monthly marathon — consistency beats luck over four weeks.",
    rules:
      "30-day window. Ranked by total return % from monthly baseline. Paper capital only — simulated performance.",
    rulesSummary: "Best monthly return %",
    periodTypes: ["MONTHLY"],
    scopes: ["GLOBAL", "FRIENDS"],
    icon: "chart",
    sortOrder: 4,
  },
  {
    key: "comeback-kings",
    title: "Comeback Kings",
    description: "Started behind? Climb the ranks from your league baseline.",
    rules:
      "Designed for traders who joined mid-period. Everyone ranked on return from their own snapshot — fair chase.",
    rulesSummary: "Biggest comeback from baseline",
    periodTypes: ["WEEKLY", "MONTHLY"],
    scopes: ["GLOBAL"],
    icon: "flame",
    sortOrder: 5,
  },
  {
    key: "algo-arena",
    title: "Algo Arena",
    description: "Deploy a strategy and compete on automated paper discipline.",
    rules:
      "Bonus flair for active strategy deployments. Ranked by return %; deploy at least one preset or marketplace strategy during the period.",
    rulesSummary: "Strategy deployers leaderboard",
    periodTypes: ["WEEKLY"],
    scopes: ["GLOBAL", "FRIENDS"],
    icon: "cpu",
    sortOrder: 6,
  },
  {
    key: "monthly-friends-cup",
    title: "Monthly Friends Cup",
    description: "Thirty days to settle who runs the best paper book in your network.",
    rules:
      "Friends-only monthly league. Invite rivals from /friends. Share your rank card when you hit top 3.",
    rulesSummary: "Monthly friends championship",
    periodTypes: ["MONTHLY"],
    scopes: ["FRIENDS"],
    icon: "cup",
    sortOrder: 7,
  },
  {
    key: "volatility-vault",
    title: "Volatility Vault",
    description: "Navigate choppy markets — survive and outperform the field.",
    rules:
      "Monthly global league during high-volatility calendar weeks. Return % ranking with live quote refresh.",
    rulesSummary: "Monthly global volatility league",
    periodTypes: ["MONTHLY"],
    scopes: ["GLOBAL"],
    icon: "vault",
    sortOrder: 8,
  },
];

export function pickTemplateForPeriod(
  period: "WEEKLY" | "MONTHLY",
  scope: "GLOBAL" | "FRIENDS",
  index: number
): CompetitionTemplateDef {
  const pool = COMPETITION_TEMPLATES.filter(
    (t) =>
      t.periodTypes.includes(period) &&
      t.scopes.includes(scope)
  );
  if (!pool.length) {
    return COMPETITION_TEMPLATES[0];
  }
  return pool[index % pool.length];
}
