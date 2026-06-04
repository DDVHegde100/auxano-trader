import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await requireDbUser(_req);
  const { slug } = await params;
  const strategy = await prisma.strategy.findUnique({ where: { slug } });
  if (!strategy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.strategyLike.findUnique({
    where: { userId_strategyId: { userId: user.id, strategyId: strategy.id } },
  });

  if (existing) {
    await prisma.strategyLike.delete({ where: { id: existing.id } });
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { likeCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  }

  await prisma.strategyLike.create({
    data: { userId: user.id, strategyId: strategy.id },
  });
  await prisma.strategy.update({
    where: { id: strategy.id },
    data: { likeCount: { increment: 1 } },
  });

  return NextResponse.json({ liked: true });
}
