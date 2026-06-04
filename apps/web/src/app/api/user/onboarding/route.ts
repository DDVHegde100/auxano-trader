import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        username: body.username,
        investingExperience: body.investingExperience,
        riskTolerance: body.riskTolerance,
        financialGoal: body.financialGoal,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    return NextResponse.json({
      onboardingComplete: user.onboardingComplete,
      user,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
