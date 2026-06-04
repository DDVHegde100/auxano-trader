import { NextResponse } from "next/server";
import { prisma } from "@auxano/database";
import { PAPER_TRADING_INITIAL_BALANCE } from "@auxano/shared";
import { validateDevLogin, devAuthEnabled } from "@/lib/dev-session";

export async function POST(req: Request) {
  if (!devAuthEnabled()) {
    return NextResponse.json(
      { error: "Dev login only available in development" },
      { status: 403 }
    );
  }

  const { email, password } = await req.json();

  const result = validateDevLogin(email, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: result.user.clerkId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: result.user.clerkId,
        email: result.user.email,
        name: result.user.name,
        username: result.user.username,
        onboardingComplete: true,
        investingExperience: "INTERMEDIATE",
        riskTolerance: "MODERATE",
        financialGoal: "LEARNING",
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

  const res = NextResponse.json({
    token: result.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    },
  });

  res.cookies.set("auxano_dev_token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
