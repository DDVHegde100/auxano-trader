import { prisma, FollowStatus } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";
import { getOrFetchQuote } from "./market";
import { listCreatorStrategies } from "./strategy-library";

export async function sendFriendRequest(followerId: string, targetUsername: string) {
  const username = targetUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!username || username.length < 2) {
    throw new Error("Enter a valid username");
  }

  const target = await prisma.user.findFirst({ where: { username } });
  if (!target) throw new Error("User not found");
  if (target.id === followerId) throw new Error("You cannot add yourself");

  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId: target.id },
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") throw new Error("Already friends");
    if (existing.status === "PENDING") throw new Error("Request already sent");
    if (existing.status === "REJECTED") {
      return prisma.userFollow.update({
        where: { id: existing.id },
        data: { status: "PENDING", respondedAt: null },
        include: { following: { select: publicUserSelect } },
      });
    }
  }

  const reverse = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: { followerId: target.id, followingId: followerId },
    },
  });
  if (reverse?.status === "PENDING") {
    const accepted = await prisma.userFollow.update({
      where: { id: reverse.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
      include: {
        follower: { select: publicUserSelect },
        following: { select: publicUserSelect },
      },
    });
    const { notifyFriendAccepted } = await import("./notifications");
    await Promise.all([
      notifyFriendAccepted({
        toUserId: target.id,
        friendUserId: accepted.follower.id,
        friendUsername: accepted.follower.username,
        friendName: accepted.follower.name,
      }),
      notifyFriendAccepted({
        toUserId: followerId,
        friendUserId: target.id,
        friendUsername: target.username,
        friendName: target.name,
      }),
    ]);
    return accepted;
  }

  const created = await prisma.userFollow.create({
    data: { followerId, followingId: target.id, status: "PENDING" },
    include: { following: { select: publicUserSelect } },
  });

  const sender = await prisma.user.findUnique({
    where: { id: followerId },
    select: { id: true, username: true, name: true },
  });
  if (sender) {
    const { notifyFriendRequest } = await import("./notifications");
    await notifyFriendRequest({
      toUserId: target.id,
      fromUserId: sender.id,
      fromUsername: sender.username,
      fromName: sender.name,
      requestId: created.id,
    });
  }

  return created;
}

export async function respondToFriendRequest(
  userId: string,
  requestId: string,
  action: "accept" | "reject"
) {
  const row = await prisma.userFollow.findUnique({
    where: { id: requestId },
    include: {
      follower: { select: publicUserSelect },
      following: { select: publicUserSelect },
    },
  });
  if (!row || row.followingId !== userId) {
    throw new Error("Request not found");
  }
  if (row.status !== "PENDING") throw new Error("Request already handled");

  const status: FollowStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
  const updated = await prisma.userFollow.update({
    where: { id: requestId },
    data: { status, respondedAt: new Date() },
    include: {
      follower: { select: publicUserSelect },
      following: { select: publicUserSelect },
    },
  });

  if (action === "accept") {
    const { notifyFriendAccepted } = await import("./notifications");
    await Promise.all([
      notifyFriendAccepted({
        toUserId: updated.followerId,
        friendUserId: updated.following.id,
        friendUsername: updated.following.username,
        friendName: updated.following.name,
      }),
      notifyFriendAccepted({
        toUserId: updated.followingId,
        friendUserId: updated.follower.id,
        friendUsername: updated.follower.username,
        friendName: updated.follower.name,
      }),
    ]);
  }

  return updated;
}

export async function removeFriend(userId: string, otherUserId: string) {
  await prisma.userFollow.deleteMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { followerId: userId, followingId: otherUserId },
        { followerId: otherUserId, followingId: userId },
      ],
    },
  });
  return { ok: true };
}

const publicUserSelect = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
  bio: true,
  isProfilePublic: true,
  investingExperience: true,
  createdAt: true,
} as const;

export async function listFriendSocial(userId: string) {
  const [incoming, outgoing, accepted] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followingId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { follower: { select: publicUserSelect } },
    }),
    prisma.userFollow.findMany({
      where: { followerId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { following: { select: publicUserSelect } },
    }),
    prisma.userFollow.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ followerId: userId }, { followingId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        follower: { select: publicUserSelect },
        following: { select: publicUserSelect },
      },
    }),
  ]);

  const friends = accepted.map((row) => {
    const friend = row.followerId === userId ? row.following : row.follower;
    return {
      friendshipId: row.id,
      since: row.createdAt,
      user: friend,
    };
  });

  return {
    incoming: incoming.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      from: r.follower,
    })),
    outgoing: outgoing.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      to: r.following,
    })),
    friends,
  };
}

export async function searchUsers(query: string, viewerId: string, limit = 12) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      onboardingComplete: true,
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
      NOT: { id: viewerId },
    },
    take: limit,
    select: publicUserSelect,
  });

  const relations = await prisma.userFollow.findMany({
    where: {
      OR: [
        { followerId: viewerId, followingId: { in: users.map((u) => u.id) } },
        { followerId: { in: users.map((u) => u.id) }, followingId: viewerId },
      ],
    },
  });

  return users.map((u) => {
    const out = relations.find(
      (r) => r.followerId === viewerId && r.followingId === u.id
    );
    const inc = relations.find(
      (r) => r.followerId === u.id && r.followingId === viewerId
    );
    let relation: "none" | "pending_out" | "pending_in" | "friends" | "rejected" =
      "none";
    const row = out ?? inc;
    if (row?.status === "ACCEPTED") relation = "friends";
    else if (out?.status === "PENDING") relation = "pending_out";
    else if (inc?.status === "PENDING") relation = "pending_in";
    else if (row?.status === "REJECTED") relation = "rejected";
    return { ...u, relation };
  });
}

export async function getUserProfile(username: string, viewerId?: string) {
  const uname = username.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { username: uname },
    include: {
      paperAccount: { include: { positions: true } },
    },
  });
  if (!user) return null;

  const isSelf = viewerId === user.id;
  const strategies = (await listCreatorStrategies(user.id, viewerId)).slice(0, 12);
  let relation: "none" | "pending_out" | "pending_in" | "friends" = "none";
  if (viewerId && !isSelf) {
    const row = await prisma.userFollow.findFirst({
      where: {
        OR: [
          { followerId: viewerId, followingId: user.id },
          { followerId: user.id, followingId: viewerId },
        ],
      },
    });
    if (row?.status === "ACCEPTED") relation = "friends";
    else if (row?.status === "PENDING" && row.followerId === viewerId)
      relation = "pending_out";
    else if (row?.status === "PENDING") relation = "pending_in";
  }

  const canViewPortfolio =
    isSelf ||
    user.isProfilePublic ||
    relation === "friends";

  let portfolio: {
    totalValue: number;
    returnPct: number;
    cashBalance: number;
  } | null = null;

  if (canViewPortfolio && user.paperAccount) {
    const acc = user.paperAccount;
    const cash = decimalToNumber(acc.cashBalance);
    const initial = decimalToNumber(acc.initialBalance);
    let posVal = 0;
    for (const p of acc.positions) {
      const live = await getOrFetchQuote(p.symbol);
      const price = live?.price ?? 0;
      posVal += decimalToNumber(p.quantity) * price;
    }
    const total = cash + posVal;
    portfolio = {
      totalValue: total,
      returnPct: initial > 0 ? ((total - initial) / initial) * 100 : 0,
      cashBalance: cash,
    };
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isProfilePublic: user.isProfilePublic,
      investingExperience: user.investingExperience,
      riskTolerance: user.riskTolerance,
      financialGoal: user.financialGoal,
      createdAt: user.createdAt,
    },
    strategies,
    portfolio,
    relation,
    isSelf,
    canViewPortfolio,
  };
}

export async function updateMyProfile(
  userId: string,
  data: { bio?: string; isProfilePublic?: boolean }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      bio: data.bio?.trim() || null,
      isProfilePublic: data.isProfilePublic,
    },
    select: publicUserSelect,
  });
}
