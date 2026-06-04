import { currentUser } from "@clerk/nextjs/server";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "@auxano/database";
import { PAPER_TRADING_INITIAL_BALANCE, DEV_TEST_CLERK_ID } from "@auxano/shared";
import { verifyDevToken, devAuthEnabled } from "@/lib/dev-session";
import { getSessionClerkId } from "@/lib/session";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

async function resolveClerkId(req?: Request): Promise<string | null> {
  // Clerk session cookie (web UI + same-origin fetch to API routes)
  const sessionId = await getSessionClerkId();
  if (sessionId) return sessionId;

  if (req && devAuthEnabled()) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/auxano_dev_token=([^;]+)/);
    if (match?.[1]) {
      const clerkId = verifyDevToken(decodeURIComponent(match[1]));
      if (clerkId) return clerkId;
    }
  }

  if (!req) return null;

  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const devClerkId = verifyDevToken(token);
  if (devClerkId) return devClerkId;

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return payload.sub;
  } catch {
    return null;
  }
}

export async function getOrCreateDbUser(req?: Request) {
  const clerkId = await resolveClerkId(req);
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    if (clerkId === DEV_TEST_CLERK_ID) {
      const { DEV_TEST_EMAIL, DEV_TEST_NAME, DEV_TEST_USERNAME } = await import(
        "@auxano/shared"
      );
      user = await prisma.user.create({
        data: {
          clerkId: DEV_TEST_CLERK_ID,
          email: DEV_TEST_EMAIL,
          name: DEV_TEST_NAME,
          username: DEV_TEST_USERNAME,
          onboardingComplete: true,
        },
      });
      await prisma.paperAccount.create({
        data: {
          userId: user.id,
          cashBalance: PAPER_TRADING_INITIAL_BALANCE,
          initialBalance: PAPER_TRADING_INITIAL_BALANCE,
        },
      });
      return user;
    }

    const sessionUser = await currentUser();
    let email = sessionUser?.emailAddresses?.[0]?.emailAddress;
    let name =
      sessionUser?.fullName ??
      ([sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(" ") ||
        null);
    let avatarUrl = sessionUser?.imageUrl ?? null;

    if (!email) {
      try {
        const apiUser = await clerkClient.users.getUser(clerkId);
        email = apiUser.emailAddresses[0]?.emailAddress;
        name =
          [apiUser.firstName, apiUser.lastName].filter(Boolean).join(" ") ||
          name;
        avatarUrl = apiUser.imageUrl;
      } catch {
        email = `${clerkId}@auxano.local`;
      }
    }

    user = await prisma.user.create({
      data: {
        clerkId,
        email: email ?? `${clerkId}@auxano.local`,
        name,
        avatarUrl,
      },
    });

    await prisma.paperAccount.create({
      data: {
        userId: user.id,
        cashBalance: PAPER_TRADING_INITIAL_BALANCE,
        initialBalance: PAPER_TRADING_INITIAL_BALANCE,
      },
    });

    await prisma.watchlist.create({
      data: {
        userId: user.id,
        name: "My Watchlist",
        items: {
          create: [{ symbol: "AAPL" }, { symbol: "NVDA" }, { symbol: "MSFT" }],
        },
      },
    });
  }

  return user;
}

export async function requireDbUser(req?: Request) {
  const user = await getOrCreateDbUser(req);
  if (!user) throw new Error("Unauthorized");
  return user;
}
