import { prisma } from "@auxano/database";
import type { StrategyVisibility } from "@prisma/client";

export type StrategyVisibilityInput = "PUBLIC" | "FRIENDS" | "PRIVATE";

export function visibilityToIsPublic(visibility: StrategyVisibilityInput): boolean {
  return visibility === "PUBLIC";
}

export function parseVisibility(
  value: unknown,
  fallback: StrategyVisibilityInput = "PUBLIC"
): StrategyVisibilityInput {
  if (value === "PUBLIC" || value === "FRIENDS" || value === "PRIVATE") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? "PUBLIC" : "PRIVATE";
  }
  return fallback;
}

export async function areFriends(
  userIdA: string,
  userIdB: string
): Promise<boolean> {
  if (userIdA === userIdB) return true;
  const row = await prisma.userFollow.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { followerId: userIdA, followingId: userIdB },
        { followerId: userIdB, followingId: userIdA },
      ],
    },
  });
  return !!row;
}

export async function canViewStrategy(params: {
  strategy: {
    creatorId: string;
    visibility: StrategyVisibility;
    isPublished: boolean;
  };
  viewerId?: string | null;
  isFriend?: boolean;
}): Promise<boolean> {
  const { strategy, viewerId } = params;
  if (viewerId === strategy.creatorId) return true;

  if (!strategy.isPublished) return false;

  if (strategy.visibility === "PUBLIC") return true;
  if (strategy.visibility === "PRIVATE") return false;
  if (strategy.visibility === "FRIENDS") {
    if (!viewerId) return false;
    const friend =
      params.isFriend ?? (await areFriends(viewerId, strategy.creatorId));
    return friend;
  }
  return false;
}
