import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { slug } = await params;
    const { allocated = 10000 } = await req.json().catch(() => ({}));

    const strategy = await prisma.strategy.findUnique({ where: { slug } });
    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.strategyDeployment.upsert({
      where: {
        strategyId_userId: { strategyId: strategy.id, userId: user.id },
      },
      create: {
        strategyId: strategy.id,
        userId: user.id,
        isActive: true,
        allocated,
      },
      update: { isActive: true, allocated },
    });

    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { deployedCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, strategyId: strategy.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deploy failed" },
      { status: 400 }
    );
  }
}
