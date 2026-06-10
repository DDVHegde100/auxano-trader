import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import type { StrategyLogic } from "@auxano/shared";
import {
  configureAutopilotOnDeploy,
  resolvePrimarySymbol,
  runDeploymentAutopilot,
} from "@/lib/services/autopilot";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const { allocated = 10000, primarySymbol, intervalMinutes } = body;

    const strategy = await prisma.strategy.findUnique({ where: { slug } });
    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const logic = strategy.logicJson as unknown as StrategyLogic;
    const symbol = primarySymbol
      ? String(primarySymbol).toUpperCase()
      : resolvePrimarySymbol(logic, "AAPL");

    const deployment = await prisma.strategyDeployment.upsert({
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

    await configureAutopilotOnDeploy({
      deploymentId: deployment.id,
      logic,
      primarySymbol: symbol,
      intervalMinutes: intervalMinutes ?? 10,
    });

    runDeploymentAutopilot(deployment.id).catch(() => {});

    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { deployedCount: { increment: 1 } },
    });

    const { notifyStrategyDeployed } = await import("@/lib/services/notifications");
    await notifyStrategyDeployed({
      userId: user.id,
      strategyName: strategy.name,
      strategySlug: strategy.slug,
      symbol,
    });

    return NextResponse.json({
      success: true,
      strategyId: strategy.id,
      deploymentId: deployment.id,
      autopilot: true,
      primarySymbol: symbol,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deploy failed" },
      { status: 400 }
    );
  }
}
