import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { cookies } from "next/headers";
import { ONBOARDING_SIGNUP_COOKIE } from "@/lib/onboarding-storage";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();

    const investingExperience = body.investingExperience || null;
    const riskTolerance = body.riskTolerance || null;
    const financialGoal = body.financialGoal || null;

    if (!investingExperience || !riskTolerance || !financialGoal) {
      return NextResponse.json(
        { error: "Please complete experience, risk, and goal steps" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        investingExperience,
        riskTolerance,
        financialGoal,
        onboardingComplete: true,
      },
    });

    const jar = await cookies();
    jar.delete(ONBOARDING_SIGNUP_COOKIE);

    return NextResponse.json({
      user: updated,
      onboardingComplete: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    return NextResponse.json({
      onboardingComplete: user.onboardingComplete,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        investingExperience: user.investingExperience,
        riskTolerance: user.riskTolerance,
        financialGoal: user.financialGoal,
        isProfilePublic: user.isProfilePublic,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
