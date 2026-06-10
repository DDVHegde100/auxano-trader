import { prisma, NotificationType, Prisma } from "@auxano/database";
import { sendExpoPush } from "@/lib/notifications/push-delivery";
import type {
  NotificationMetadata,
  NotificationDto,
  NotificationPrefsDto,
} from "@/lib/notifications/types";

const DEFAULT_PREFS = {
  pushEnabled: true,
  inAppEnabled: true,
  notifyFriends: true,
  notifyTrading: true,
  notifyLeaderboard: true,
  notifyStrategies: true,
  notifyAutopilot: true,
  webPushEnabled: false,
};

function metadataToJson(meta?: NotificationMetadata): Prisma.InputJsonValue | undefined {
  if (!meta) return undefined;
  return meta as Prisma.InputJsonValue;
}

function parseMetadata(raw: unknown): NotificationMetadata | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as NotificationMetadata;
}

function typeAllowed(
  type: NotificationType,
  prefs: {
    notifyFriends: boolean;
    notifyTrading: boolean;
    notifyLeaderboard: boolean;
    notifyStrategies: boolean;
    notifyAutopilot: boolean;
  }
): boolean {
  switch (type) {
    case "FRIEND_REQUEST":
    case "FRIEND_ACCEPTED":
      return prefs.notifyFriends;
    case "TRADE_FILL":
      return prefs.notifyTrading;
    case "LEADERBOARD_PASSED":
    case "LEAGUE_UPDATE":
      return prefs.notifyLeaderboard;
    case "DUEL_INVITE":
    case "DUEL_ACCEPTED":
    case "DUEL_RESULT":
      return prefs.notifyFriends;
    case "STRATEGY_ALERT":
      return prefs.notifyStrategies;
    case "AUTOPILOT_ERROR":
    case "AUTOPILOT_TRADE":
      return prefs.notifyAutopilot;
    default:
      return true;
  }
}

export async function ensureNotificationPrefs(userId: string) {
  return prisma.userNotificationPrefs.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_PREFS },
    update: {},
  });
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
  groupKey?: string;
  skipPush?: boolean;
}): Promise<NotificationDto | null> {
  const prefs = await ensureNotificationPrefs(input.userId);
  if (!prefs.inAppEnabled) return null;
  if (!typeAllowed(input.type, prefs)) return null;

  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: metadataToJson(input.metadata),
      groupKey: input.groupKey ?? null,
    },
  });

  if (
    !input.skipPush &&
    prefs.pushEnabled &&
    prefs.expoPushToken
  ) {
    sendExpoPush(
      [prefs.expoPushToken],
      input.title,
      input.body,
      { ...input.metadata, type: input.type }
    ).catch(() => {});
  }

  return toDto(row);
}

export function toDto(row: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  metadata: unknown;
  groupKey: string | null;
  createdAt: Date;
}): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    metadata: parseMetadata(row.metadata),
    groupKey: row.groupKey,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean; category?: string }
) {
  const limit = options?.limit ?? 50;
  const where: Prisma.NotificationWhereInput = { userId };
  if (options?.unreadOnly) where.read = false;

  if (options?.category === "social") {
    where.type = { in: ["FRIEND_REQUEST", "FRIEND_ACCEPTED"] };
  } else if (options?.category === "trading") {
    where.type = { in: ["TRADE_FILL", "STRATEGY_ALERT", "AUTOPILOT_ERROR"] };
  } else if (options?.category === "leaderboard") {
    where.type = "LEADERBOARD_PASSED";
  }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const grouped = groupNotifications(items.map(toDto));

  return { items: items.map(toDto), grouped, unreadCount };
}

function groupNotifications(items: NotificationDto[]) {
  const map = new Map<
    string,
    { key: string; label: string; items: NotificationDto[]; latestAt: string }
  >();

  for (const n of items) {
    const day = n.createdAt.split("T")[0];
    const key = n.groupKey ?? `${n.type}-${day}`;
    const label =
      n.groupKey?.startsWith("trade-") && n.metadata?.symbol
        ? `Trades · ${n.metadata.symbol}`
        : `${n.type} · ${day}`;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(n);
      if (n.createdAt > existing.latestAt) existing.latestAt = n.createdAt;
    } else {
      map.set(key, { key, label, items: [n], latestAt: n.createdAt });
    }
  }

  return [...map.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

export async function markNotificationsRead(
  userId: string,
  ids?: string[]
) {
  if (ids?.length) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
  return listNotifications(userId, { limit: 30 });
}

export async function getNotificationPrefs(
  userId: string
): Promise<NotificationPrefsDto> {
  const prefs = await ensureNotificationPrefs(userId);
  return {
    pushEnabled: prefs.pushEnabled,
    inAppEnabled: prefs.inAppEnabled,
    notifyFriends: prefs.notifyFriends,
    notifyTrading: prefs.notifyTrading,
    notifyLeaderboard: prefs.notifyLeaderboard,
    notifyStrategies: prefs.notifyStrategies,
    notifyAutopilot: prefs.notifyAutopilot,
    webPushEnabled: prefs.webPushEnabled,
    hasExpoPushToken: !!prefs.expoPushToken,
  };
}

export async function updateNotificationPrefs(
  userId: string,
  data: Partial<NotificationPrefsDto> & {
    expoPushToken?: string | null;
    webPushEnabled?: boolean;
  }
) {
  await prisma.userNotificationPrefs.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_PREFS,
      pushEnabled: data.pushEnabled ?? DEFAULT_PREFS.pushEnabled,
      inAppEnabled: data.inAppEnabled ?? DEFAULT_PREFS.inAppEnabled,
      notifyFriends: data.notifyFriends ?? DEFAULT_PREFS.notifyFriends,
      notifyTrading: data.notifyTrading ?? DEFAULT_PREFS.notifyTrading,
      notifyLeaderboard: data.notifyLeaderboard ?? DEFAULT_PREFS.notifyLeaderboard,
      notifyStrategies: data.notifyStrategies ?? DEFAULT_PREFS.notifyStrategies,
      notifyAutopilot: data.notifyAutopilot ?? DEFAULT_PREFS.notifyAutopilot,
      webPushEnabled: data.webPushEnabled ?? DEFAULT_PREFS.webPushEnabled,
      expoPushToken:
        data.expoPushToken !== undefined ? data.expoPushToken : null,
    },
    update: {
      ...(data.pushEnabled !== undefined ? { pushEnabled: data.pushEnabled } : {}),
      ...(data.inAppEnabled !== undefined ? { inAppEnabled: data.inAppEnabled } : {}),
      ...(data.notifyFriends !== undefined
        ? { notifyFriends: data.notifyFriends }
        : {}),
      ...(data.notifyTrading !== undefined
        ? { notifyTrading: data.notifyTrading }
        : {}),
      ...(data.notifyLeaderboard !== undefined
        ? { notifyLeaderboard: data.notifyLeaderboard }
        : {}),
      ...(data.notifyStrategies !== undefined
        ? { notifyStrategies: data.notifyStrategies }
        : {}),
      ...(data.notifyAutopilot !== undefined
        ? { notifyAutopilot: data.notifyAutopilot }
        : {}),
      ...(data.webPushEnabled !== undefined
        ? { webPushEnabled: data.webPushEnabled }
        : {}),
      ...(data.expoPushToken !== undefined
        ? { expoPushToken: data.expoPushToken }
        : {}),
    },
  });
  return getNotificationPrefs(userId);
}

// ——— Event helpers ———

export async function notifyFriendRequest(params: {
  toUserId: string;
  fromUserId: string;
  fromUsername: string | null;
  fromName: string | null;
  requestId: string;
}) {
  const label = params.fromName ?? params.fromUsername ?? "Someone";
  return createNotification({
    userId: params.toUserId,
    type: "FRIEND_REQUEST",
    title: "New friend request",
    body: `${label} wants to connect on Auxano`,
    groupKey: `friend-req-${params.fromUserId}`,
    metadata: {
      href: "/friends",
      actorId: params.fromUserId,
      actorUsername: params.fromUsername ?? undefined,
      actorName: params.fromName ?? undefined,
    },
  });
}

export async function notifyFriendAccepted(params: {
  toUserId: string;
  friendUserId: string;
  friendUsername: string | null;
  friendName: string | null;
}) {
  const label = params.friendName ?? params.friendUsername ?? "A trader";
  return createNotification({
    userId: params.toUserId,
    type: "FRIEND_ACCEPTED",
    title: "Friend request accepted",
    body: `You and ${label} are now connected`,
    metadata: {
      href: params.friendUsername
        ? `/profile/${params.friendUsername}`
        : "/friends",
      actorId: params.friendUserId,
      actorUsername: params.friendUsername ?? undefined,
      actorName: params.friendName ?? undefined,
    },
  });
}

export async function notifyTradeFill(params: {
  userId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
}) {
  const sideLabel = params.side === "BUY" ? "Bought" : "Sold";
  return createNotification({
    userId: params.userId,
    type: "TRADE_FILL",
    title: "Paper trade filled",
    body: `${sideLabel} ${params.quantity.toFixed(2)} ${params.symbol} @ $${params.price.toFixed(2)}`,
    groupKey: `trade-${params.symbol}-${new Date().toISOString().split("T")[0]}`,
    metadata: {
      href: "/portfolio",
      symbol: params.symbol,
      side: params.side,
    },
  });
}

export async function notifyLeaderboardPassed(params: {
  toUserId: string;
  passerUserId: string;
  passerUsername: string | null;
  passerName: string | null;
  newRank: number;
}) {
  const label = params.passerName ?? params.passerUsername ?? "A trader";
  return createNotification({
    userId: params.toUserId,
    type: "LEADERBOARD_PASSED",
    title: "Leaderboard update",
    body: `${label} passed you — now #${params.newRank} on paper traders`,
    groupKey: `lb-pass-${params.passerUserId}`,
    metadata: {
      href: "/leaderboard",
      actorId: params.passerUserId,
      actorUsername: params.passerUsername ?? undefined,
      actorName: params.passerName ?? undefined,
      rank: params.newRank,
    },
  });
}

export async function notifyStrategyDeployed(params: {
  userId: string;
  strategyName: string;
  strategySlug: string;
  symbol: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "STRATEGY_ALERT",
    title: "Strategy deployed",
    body: `${params.strategyName} is active on ${params.symbol} (paper)`,
    metadata: {
      href: "/bots",
      strategyName: params.strategyName,
      strategySlug: params.strategySlug,
      symbol: params.symbol,
    },
  });
}

export async function notifyDuelInvite(params: {
  toUserId: string;
  fromUserId: string;
  fromUsername: string | null;
  fromName: string | null;
  duelId: string;
  inviteCode: string;
  durationDays: number;
}) {
  const label = params.fromName ?? params.fromUsername ?? "A friend";
  return createNotification({
    userId: params.toUserId,
    type: "DUEL_INVITE",
    title: "Head-to-head challenge",
    body: `${label} challenged you to a ${params.durationDays}-day paper duel`,
    metadata: {
      href: `/compete/duel/${params.duelId}`,
      actorId: params.fromUserId,
      actorUsername: params.fromUsername ?? undefined,
      actorName: params.fromName ?? undefined,
    },
  });
}

export async function notifyDuelAccepted(params: {
  toUserId: string;
  fromUserId: string;
  fromUsername: string | null;
  fromName: string | null;
  duelId: string;
  inviteCode: string;
}) {
  const label = params.fromName ?? params.fromUsername ?? "Your opponent";
  return createNotification({
    userId: params.toUserId,
    type: "DUEL_ACCEPTED",
    title: "Challenge accepted",
    body: `${label} accepted — duel is live`,
    metadata: {
      href: `/compete/duel/${params.duelId}`,
      actorId: params.fromUserId,
      actorUsername: params.fromUsername ?? undefined,
    },
  });
}

export async function notifyDuelResult(params: {
  duelId: string;
  winnerId: string | null;
  creatorId: string;
  opponentId: string;
  inviteCode: string;
}) {
  const users = await prisma.user.findMany({
    where: { id: { in: [params.creatorId, params.opponentId] } },
    select: { id: true, username: true, name: true },
  });
  const creator = users.find((u) => u.id === params.creatorId);
  const opponent = users.find((u) => u.id === params.opponentId);

  for (const uid of [params.creatorId, params.opponentId]) {
    const won = params.winnerId === uid;
    const other =
      uid === params.creatorId ? opponent?.name ?? opponent?.username : creator?.name ?? creator?.username;
    await createNotification({
      userId: uid,
      type: "DUEL_RESULT",
      title: won ? "You won the duel" : "Duel finished",
      body: won
        ? `You beat ${other ?? "your opponent"} (paper)`
        : params.winnerId
          ? `${other ?? "Opponent"} won this round`
          : "Tie — no winner this time",
      metadata: { href: `/compete/duel/${params.duelId}` },
    });
  }
}

export async function notifyLeagueRank(params: {
  userId: string;
  leagueTitle: string;
  rank: number;
  leagueId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "LEAGUE_UPDATE",
    title: "League standing",
    body: `You're #${params.rank} in ${params.leagueTitle}`,
    metadata: { href: `/compete/league/${params.leagueId}`, rank: params.rank },
  });
}

export async function notifyAutopilotError(params: {
  userId: string;
  strategyName: string;
  message: string;
  strategySlug?: string;
  deploymentId?: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "AUTOPILOT_ERROR",
    title: "Autopilot paused",
    body: `${params.strategyName}: ${params.message}`,
    metadata: {
      href: params.deploymentId
        ? `/bots/${params.deploymentId}`
        : params.strategySlug
          ? `/strategies/${params.strategySlug}`
          : "/bots",
      strategyName: params.strategyName,
      strategySlug: params.strategySlug,
      errorCode: "AUTOPILOT",
    },
  });
}

export async function notifyAutopilotTrade(params: {
  userId: string;
  strategyName: string;
  deploymentId: string;
  side: "BUY" | "SELL";
  symbol: string;
  price: number;
  realizedPnl?: number;
}) {
  const pnl =
    params.realizedPnl != null
      ? ` · P&L $${params.realizedPnl.toFixed(2)}`
      : "";
  return createNotification({
    userId: params.userId,
    type: "AUTOPILOT_TRADE",
    title: `Bot ${params.side} ${params.symbol}`,
    body: `${params.strategyName} @ $${params.price.toFixed(2)}${pnl}`,
    metadata: {
      href: `/bots/${params.deploymentId}`,
      symbol: params.symbol,
      side: params.side,
    },
  });
}
