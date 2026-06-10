import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { duplicateUserStrategy } from "@/lib/services/strategy-library";
import { prisma } from "@auxano/database";

export async function POST(
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
    const copy = await duplicateUserStrategy(strategy.id, user.id);
    return NextResponse.json({
      strategy: {
        id: copy.id,
        slug: copy.slug,
        name: copy.name,
        visibility: copy.visibility,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
