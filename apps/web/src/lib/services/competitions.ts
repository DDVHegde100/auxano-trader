import { prisma, LeaguePeriod, LeagueScope, DuelStatus } from "@auxano/database";
import {
  COMPETITION_TEMPLATES,
  pickTemplateForPeriod,
  PAPER_TRADING_INITIAL_BALANCE,
} from "@auxano/shared";
import { decimalToNumber } from "@auxano/shared";
import { getPortfolioValue } from "./portfolio-value";
import { getPublicAppUrl } from "@/lib/share/public-url";
import {
  getWeekSeasonKey,
  getMonthSeasonKey,
  getWeekBounds,
  getMonthBounds,
  weekIndex,
  monthIndex,
} from "@/lib/competitions/period-keys";

export type StandingRow = {
  userId: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  baselineValue: number;
  currentValue: number;
  returnPct: number;
  rank: number;
  isSelf?: boolean;
};

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function ensureChallengeTemplates() {
  for (const t of COMPETITION_TEMPLATES) {
    await prisma.challengeTemplate.upsert({
      where: { key: t.key },
      create: {
        key: t.key,
        title: t.title,
        description: t.description,
        rules: t.rules,
        periodTypes: t.periodTypes,
        scopes: t.scopes,
        icon: t.icon,
        sortOrder: t.sortOrder,
      },
      update: {
        title: t.title,
        description: t.description,
        rules: t.rules,
        periodTypes: t.periodTypes,
        scopes: t.scopes,
        icon: t.icon,
        sortOrder: t.sortOrder,
        active: true,
      },
    });
  }
}

async function upsertLeague(params: {
  seasonKey: string;
  period: LeaguePeriod;
  scope: LeagueScope;
  templateKey: string;
  title: string;
  description: string;
  rulesSummary: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const now = new Date();
  let status: "SCHEDULED" | "ACTIVE" | "ENDED" = "SCHEDULED";
  if (now >= params.startsAt && now <= params.endsAt) status = "ACTIVE";
  if (now > params.endsAt) status = "ENDED";

  return prisma.league.upsert({
    where: { seasonKey: params.seasonKey },
    create: {
      seasonKey: params.seasonKey,
      period: params.period,
      scope: params.scope,
      status,
      templateKey: params.templateKey,
      title: params.title,
      description: params.description,
      rulesSummary: params.rulesSummary,
      startsAt: params.startsAt,
      endsAt: params.endsAt,
      baselineCapital: PAPER_TRADING_INITIAL_BALANCE,
    },
    update: { status },
  });
}

export async function ensureActiveLeagues() {
  await ensureChallengeTemplates();
  const now = new Date();
  const weekBounds = getWeekBounds(now);
  const monthBounds = getMonthBounds(now);
  const wIdx = weekIndex(now);
  const mIdx = monthIndex(now);

  const configs: {
    period: LeaguePeriod;
    scope: LeagueScope;
    seasonKey: string;
    bounds: { startsAt: Date; endsAt: Date };
    index: number;
  }[] = [
    {
      period: "WEEKLY",
      scope: "GLOBAL",
      seasonKey: `${getWeekSeasonKey(now)}-global`,
      bounds: weekBounds,
      index: wIdx,
    },
    {
      period: "WEEKLY",
      scope: "FRIENDS",
      seasonKey: `${getWeekSeasonKey(now)}-friends`,
      bounds: weekBounds,
      index: wIdx + 1,
    },
    {
      period: "MONTHLY",
      scope: "GLOBAL",
      seasonKey: `${getMonthSeasonKey(now)}-global`,
      bounds: monthBounds,
      index: mIdx,
    },
    {
      period: "MONTHLY",
      scope: "FRIENDS",
      seasonKey: `${getMonthSeasonKey(now)}-friends`,
      bounds: monthBounds,
      index: mIdx + 1,
    },
  ];

  for (const c of configs) {
    const tpl = pickTemplateForPeriod(c.period, c.scope, c.index);
    await upsertLeague({
      seasonKey: c.seasonKey,
      period: c.period,
      scope: c.scope,
      templateKey: tpl.key,
      title: `${tpl.title} · ${c.scope === "FRIENDS" ? "Friends" : "Global"}`,
      description: tpl.description,
      rulesSummary: tpl.rulesSummary,
      startsAt: c.bounds.startsAt,
      endsAt: c.bounds.endsAt,
    });
  }

  await prisma.league.updateMany({
    where: { endsAt: { lt: now }, status: { not: "ENDED" } },
    data: { status: "ENDED" },
  });
}

async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.userFollow.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ followerId: userId }, { followingId: userId }],
    },
  });
  return rows.map((r) =>
    r.followerId === userId ? r.followingId : r.followerId
  );
}

export async function joinLeague(userId: string, leagueId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) throw new Error("League not found");
  if (league.status === "ENDED") throw new Error("This league has ended");

  const existing = await prisma.leagueParticipant.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  if (existing) return existing;

  const pv = await getPortfolioValue(userId);
  if (!pv) throw new Error("Paper account required to join");

  return prisma.leagueParticipant.create({
    data: {
      leagueId,
      userId,
      baselineValue: pv.totalValue,
      baselineAt: new Date(),
    },
  });
}

export async function autoJoinActiveLeagues(userId: string) {
  const active = await prisma.league.findMany({
    where: { status: "ACTIVE" },
  });
  for (const l of active) {
    await joinLeague(userId, l.id).catch(() => {});
  }
}

export async function computeLeagueStandings(
  leagueId: string,
  viewerId?: string
): Promise<{
  league: {
    id: string;
    title: string;
    description: string;
    rulesSummary: string;
    period: string;
    scope: string;
    status: string;
    startsAt: string;
    endsAt: string;
    seasonKey: string;
    templateKey: string;
  };
  standings: StandingRow[];
  viewerEntry: StandingRow | null;
  participantCount: number;
}> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              isProfilePublic: true,
            },
          },
        },
      },
    },
  });
  if (!league) throw new Error("League not found");

  let participants = league.participants;
  if (league.scope === "FRIENDS" && viewerId) {
    const friendIds = new Set(await getFriendIds(viewerId));
    friendIds.add(viewerId);
    participants = participants.filter((p) => friendIds.has(p.userId));
  }

  const rows: StandingRow[] = [];
  for (const p of participants) {
    const pv = await getPortfolioValue(p.userId);
    if (!pv) continue;
    const baseline = decimalToNumber(p.baselineValue);
    const ret =
      baseline > 0 ? ((pv.totalValue - baseline) / baseline) * 100 : 0;
    rows.push({
      userId: p.userId,
      username: p.user.username,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl,
      baselineValue: baseline,
      currentValue: pv.totalValue,
      returnPct: ret,
      rank: 0,
      isSelf: viewerId === p.userId,
    });
  }

  rows.sort((a, b) => b.returnPct - a.returnPct);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  const viewerEntry = viewerId
    ? rows.find((r) => r.userId === viewerId) ?? null
    : null;

  if (viewerEntry && viewerId && viewerEntry.rank <= 3 && league.status === "ACTIVE") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await prisma.notification.findFirst({
      where: {
        userId: viewerId,
        type: "LEAGUE_UPDATE",
        createdAt: { gte: since },
        metadata: { path: ["href"], equals: `/compete/league/${leagueId}` },
      },
    });
    if (!recent) {
      const { notifyLeagueRank } = await import("./notifications");
      await notifyLeagueRank({
        userId: viewerId,
        leagueTitle: league.title,
        rank: viewerEntry.rank,
        leagueId,
      }).catch(() => {});
    }
  }

  return {
    league: {
      id: league.id,
      title: league.title,
      description: league.description,
      rulesSummary: league.rulesSummary,
      period: league.period,
      scope: league.scope,
      status: league.status,
      startsAt: league.startsAt.toISOString(),
      endsAt: league.endsAt.toISOString(),
      seasonKey: league.seasonKey,
      templateKey: league.templateKey,
    },
    standings: rows.slice(0, 50),
    viewerEntry,
    participantCount: rows.length,
  };
}

export async function getCompeteOverview(userId: string) {
  await ensureActiveLeagues();
  await autoJoinActiveLeagues(userId);

  const leagues = await prisma.league.findMany({
    where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
    orderBy: { startsAt: "desc" },
  });

  const leagueSummaries = await Promise.all(
    leagues.map(async (l) => {
      const data = await computeLeagueStandings(l.id, userId);
      return {
        ...data.league,
        participantCount: data.participantCount,
        viewerRank: data.viewerEntry?.rank ?? null,
        viewerReturnPct: data.viewerEntry?.returnPct ?? null,
        topThree: data.standings.slice(0, 3),
      };
    })
  );

  const duels = await prisma.headToHeadDuel.findMany({
    where: {
      OR: [{ creatorId: userId }, { opponentId: userId }],
      status: { in: ["PENDING", "ACTIVE"] },
    },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarUrl: true } },
      opponent: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const enrichedDuels = await Promise.all(
    duels.map((d) => enrichDuel(d, userId))
  );

  return {
    leagues: leagueSummaries,
    duels: enrichedDuels,
    inviteBaseUrl: `${getPublicAppUrl()}/challenge`,
  };
}

async function enrichDuel(
  duel: {
    id: string;
    inviteCode: string;
    creatorId: string;
    opponentId: string | null;
    status: DuelStatus;
    title: string;
    durationDays: number;
    startsAt: Date | null;
    endsAt: Date | null;
    creatorBaseline: { toString(): string } | null;
    opponentBaseline: { toString(): string } | null;
    winnerId: string | null;
    message: string | null;
    createdAt: Date;
    creator: { id: string; username: string | null; name: string | null; avatarUrl: string | null };
    opponent: { id: string; username: string | null; name: string | null; avatarUrl: string | null } | null;
  },
  viewerId: string
) {
  let creatorReturnPct: number | null = null;
  let opponentReturnPct: number | null = null;

  if (duel.status === "ACTIVE" && duel.creatorBaseline && duel.opponentBaseline) {
    const cPv = await getPortfolioValue(duel.creatorId);
    const oPv = duel.opponentId ? await getPortfolioValue(duel.opponentId) : null;
    const cBase = decimalToNumber(duel.creatorBaseline);
    const oBase = decimalToNumber(duel.opponentBaseline);
    if (cPv && cBase > 0) {
      creatorReturnPct = ((cPv.totalValue - cBase) / cBase) * 100;
    }
    if (oPv && oBase > 0) {
      opponentReturnPct = ((oPv.totalValue - oBase) / oBase) * 100;
    }
  }

  return {
    id: duel.id,
    inviteCode: duel.inviteCode,
    inviteUrl: `${getPublicAppUrl()}/challenge/${duel.inviteCode}`,
    status: duel.status,
    title: duel.title,
    durationDays: duel.durationDays,
    startsAt: duel.startsAt?.toISOString() ?? null,
    endsAt: duel.endsAt?.toISOString() ?? null,
    message: duel.message,
    winnerId: duel.winnerId,
    creator: duel.creator,
    opponent: duel.opponent,
    creatorReturnPct,
    opponentReturnPct,
    isCreator: duel.creatorId === viewerId,
    isOpponent: duel.opponentId === viewerId,
  };
}

export async function createHeadToHeadDuel(params: {
  creatorId: string;
  opponentUsername?: string;
  durationDays?: number;
  message?: string;
  title?: string;
}) {
  const durationDays = params.durationDays ?? 7;
  const title = params.title ?? `${durationDays}-day paper duel`;

  let opponentId: string | null = null;
  if (params.opponentUsername) {
    const uname = params.opponentUsername.trim().toLowerCase();
    const opponent = await prisma.user.findFirst({ where: { username: uname } });
    if (!opponent) throw new Error("User not found");
    if (opponent.id === params.creatorId) {
      throw new Error("Challenge yourself from the trade screen, not here");
    }
    const friends = await getFriendIds(params.creatorId);
    if (!friends.includes(opponent.id)) {
      throw new Error("You can only challenge friends — add them first");
    }
    opponentId = opponent.id;
  }

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.headToHeadDuel.findUnique({
      where: { inviteCode },
    });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const startData = opponentId
    ? await startDuelTimestamps(durationDays, params.creatorId, opponentId)
    : null;

  const duel = await prisma.headToHeadDuel.create({
    data: {
      inviteCode,
      creatorId: params.creatorId,
      opponentId,
      status: opponentId ? "ACTIVE" : "PENDING",
      title,
      durationDays,
      message: params.message?.trim() || null,
      ...(startData ?? {}),
    },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarUrl: true } },
      opponent: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
  });

  if (opponentId) {
    const { notifyDuelInvite } = await import("./notifications");
    const creator = duel.creator;
    await notifyDuelInvite({
      toUserId: opponentId,
      fromUserId: params.creatorId,
      fromUsername: creator.username,
      fromName: creator.name,
      duelId: duel.id,
      inviteCode: duel.inviteCode,
      durationDays,
    });
  }

  return enrichDuel(duel, params.creatorId);
}

async function startDuelTimestamps(
  durationDays: number,
  creatorId: string,
  opponentId: string
) {
  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + durationDays);
  const cPv = await getPortfolioValue(creatorId);
  const oPv = await getPortfolioValue(opponentId);
  if (!cPv || !oPv) throw new Error("Both players need paper accounts");
  return {
    startsAt,
    endsAt,
    creatorBaseline: cPv.totalValue,
    opponentBaseline: oPv.totalValue,
  };
}

export async function getDuelByInviteCode(code: string) {
  const duel = await prisma.headToHeadDuel.findUnique({
    where: { inviteCode: code.toUpperCase() },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarUrl: true } },
      opponent: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
  });
  if (!duel) return null;
  return duel;
}

export async function acceptDuelInvite(code: string, userId: string) {
  const duel = await getDuelByInviteCode(code);
  if (!duel) throw new Error("Challenge not found");
  if (duel.status !== "PENDING") throw new Error("Challenge is no longer available");
  if (duel.creatorId === userId) throw new Error("You cannot accept your own challenge");
  if (duel.opponentId && duel.opponentId !== userId) {
    throw new Error("This challenge is for another player");
  }

  const ts = await startDuelTimestamps(duel.durationDays, duel.creatorId, userId);

  const updated = await prisma.headToHeadDuel.update({
    where: { id: duel.id },
    data: {
      opponentId: userId,
      status: "ACTIVE",
      ...ts,
    },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarUrl: true } },
      opponent: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
  });

  const { notifyDuelAccepted } = await import("./notifications");
  await notifyDuelAccepted({
    toUserId: duel.creatorId,
    fromUserId: userId,
    fromUsername: updated.opponent?.username ?? null,
    fromName: updated.opponent?.name ?? null,
    duelId: duel.id,
    inviteCode: duel.inviteCode,
  });

  return enrichDuel(updated, userId);
}

export async function declineDuel(duelId: string, userId: string) {
  const duel = await prisma.headToHeadDuel.findUnique({ where: { id: duelId } });
  if (!duel) throw new Error("Not found");
  if (duel.opponentId !== userId && duel.creatorId !== userId) {
    throw new Error("Not allowed");
  }
  return prisma.headToHeadDuel.update({
    where: { id: duelId },
    data: { status: "DECLINED" },
  });
}

export async function finalizeExpiredDuels() {
  const now = new Date();
  const active = await prisma.headToHeadDuel.findMany({
    where: { status: "ACTIVE", endsAt: { lt: now } },
  });

  for (const duel of active) {
    if (!duel.opponentId || !duel.creatorBaseline || !duel.opponentBaseline) {
      await prisma.headToHeadDuel.update({
        where: { id: duel.id },
        data: { status: "EXPIRED" },
      });
      continue;
    }

    const cPv = await getPortfolioValue(duel.creatorId);
    const oPv = await getPortfolioValue(duel.opponentId);
    const cBase = decimalToNumber(duel.creatorBaseline);
    const oBase = decimalToNumber(duel.opponentBaseline);
    const cRet = cPv && cBase > 0 ? (cPv.totalValue - cBase) / cBase : -Infinity;
    const oRet = oPv && oBase > 0 ? (oPv.totalValue - oBase) / oBase : -Infinity;

    let winnerId: string | null = null;
    if (cRet > oRet) winnerId = duel.creatorId;
    else if (oRet > cRet) winnerId = duel.opponentId;

    await prisma.headToHeadDuel.update({
      where: { id: duel.id },
      data: { status: "COMPLETED", winnerId },
    });

    const { notifyDuelResult } = await import("./notifications");
    await notifyDuelResult({
      duelId: duel.id,
      winnerId,
      creatorId: duel.creatorId,
      opponentId: duel.opponentId,
      inviteCode: duel.inviteCode,
    });
  }
}

export async function getDuelDetail(duelId: string, viewerId: string) {
  await finalizeExpiredDuels();
  const duel = await prisma.headToHeadDuel.findUnique({
    where: { id: duelId },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarUrl: true } },
      opponent: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
  });
  if (!duel) return null;
  return enrichDuel(duel, viewerId);
}

export function leagueShareUrl(leagueId: string, username: string, rank: number) {
  return `${getPublicAppUrl()}/u/${username}/week?league=${leagueId}&rank=${rank}`;
}
