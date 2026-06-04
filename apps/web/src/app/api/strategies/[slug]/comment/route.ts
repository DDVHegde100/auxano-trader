import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@auxano/database";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await requireDbUser(req);
  const { slug } = await params;
  const { content } = await req.json();

  const strategy = await prisma.strategy.findUnique({ where: { slug } });
  if (!strategy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { userId: user.id, strategyId: strategy.id, content },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ comment });
}
