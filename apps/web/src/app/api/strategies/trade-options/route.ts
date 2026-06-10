import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";
import { listPresetTradeOptions } from "@/lib/services/strategy-trade";

export async function GET(req: Request) {
  const user = await requireDbUser(req);

  const mine = await prisma.strategy.findMany({
    where: { creatorId: user.id },
    select: { id: true, name: true, logicJson: true, visibility: true },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  const deployed = await prisma.strategyDeployment.findMany({
    where: { userId: user.id, isActive: true },
    include: { strategy: { select: { id: true, name: true, logicJson: true } } },
  });

  return NextResponse.json({
    presets: listPresetTradeOptions(),
    strategies: mine.map((s) => ({ id: s.id, name: s.name, logicJson: s.logicJson })),
    deployments: deployed.map((d) => ({
      id: d.id,
      strategyId: d.strategyId,
      name: d.strategy.name,
    })),
  });
}
