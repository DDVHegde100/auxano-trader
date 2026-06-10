import type { NotificationType } from "@auxano/database";

export type NotificationMetadata = {
  href?: string;
  actorId?: string;
  actorUsername?: string;
  actorName?: string;
  symbol?: string;
  side?: string;
  strategySlug?: string;
  strategyName?: string;
  rank?: number;
  previousRank?: number;
  errorCode?: string;
};

export type NotificationDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  metadata: NotificationMetadata | null;
  groupKey: string | null;
  createdAt: string;
};

export type NotificationPrefsDto = {
  pushEnabled: boolean;
  inAppEnabled: boolean;
  notifyFriends: boolean;
  notifyTrading: boolean;
  notifyLeaderboard: boolean;
  notifyStrategies: boolean;
  notifyAutopilot: boolean;
  webPushEnabled: boolean;
  hasExpoPushToken: boolean;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  FRIEND_REQUEST: "Social",
  FRIEND_ACCEPTED: "Social",
  LEADERBOARD_PASSED: "Leaderboard",
  TRADE_FILL: "Trading",
  STRATEGY_ALERT: "Strategies",
  AUTOPILOT_ERROR: "Autopilot",
  AUTOPILOT_TRADE: "Autopilot",
  DUEL_INVITE: "Duel",
  DUEL_ACCEPTED: "Duel",
  DUEL_RESULT: "Duel",
  LEAGUE_UPDATE: "League",
  SYSTEM: "System",
};
