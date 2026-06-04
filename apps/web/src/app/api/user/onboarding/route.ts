import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";

export async function POST(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();

    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
        : "";

    if (!username || username.length < 2) {
      return NextResponse.json(
        { error: "Username must be at least 2 characters (letters, numbers, underscore)" },
        { status: 400 }
      );
    }

    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: user.id } },
    });
    if (taken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name?.trim() || user.name,
        username,
        investingExperience: body.investingExperience || null,
        riskTolerance: body.riskTolerance || null,
        financialGoal: body.financialGoal || null,
        onboardingComplete: true,
      },
    });

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
      user,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
