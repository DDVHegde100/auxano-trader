import { NextResponse } from "next/server";
import { getOrCreateDbUser, requireDbUser } from "@/lib/auth";
import { getStrategyBySlug } from "@/lib/services/strategies";
import {
  deleteUserStrategy,
  updateStrategyMeta,
} from "@/lib/services/strategy-library";
import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";
import { parseVisibility } from "@/lib/services/strategy-access";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getOrCreateDbUser(req);
  const strategy = await getStrategyBySlug(slug, user?.id);

  if (!strategy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...strategy,
    isOwner: user?.id === strategy.creatorId,
    historicalReturn: strategy.historicalReturn
      ? decimalToNumber(strategy.historicalReturn)
      : null,
    sharpeRatio: strategy.sharpeRatio
      ? decimalToNumber(strategy.sharpeRatio)
      : null,
    winRate: strategy.winRate ? decimalToNumber(strategy.winRate) : null,
    maxDrawdown: strategy.maxDrawdown
      ? decimalToNumber(strategy.maxDrawdown)
      : null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { slug } = await params;
    const body = await req.json();

    const strategy = await prisma.strategy.findUnique({ where: { slug } });
    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await updateStrategyMeta(strategy.id, user.id, {
      name: body.name,
      description: body.description,
      visibility: body.visibility
        ? parseVisibility(body.visibility)
        : undefined,
    });

    return NextResponse.json({ strategy: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireDbUser(req);
    const { slug } = await params;
    const strategy = await prisma.strategy.findUnique({ where: { slug } });
    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteUserStrategy(strategy.id, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
