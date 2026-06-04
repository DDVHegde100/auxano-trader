import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@auxano/database";
import { PAPER_TRADING_INITIAL_BALANCE } from "@auxano/shared";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET not configured" },
      { status: 501 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, username, image_url } =
      evt.data;
    const email =
      email_addresses?.[0]?.email_address ?? `${id}@auxano.local`;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") || null;

    const existing = await prisma.user.findUnique({ where: { clerkId: id } });
    if (!existing) {
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name,
          username: username ?? null,
          avatarUrl: image_url ?? null,
        },
      });
      await prisma.paperAccount.create({
        data: {
          userId: user.id,
          cashBalance: PAPER_TRADING_INITIAL_BALANCE,
          initialBalance: PAPER_TRADING_INITIAL_BALANCE,
        },
      });
      await prisma.watchlist.create({
        data: {
          userId: user.id,
          name: "My Watchlist",
          items: {
            create: [{ symbol: "AAPL" }, { symbol: "NVDA" }, { symbol: "MSFT" }],
          },
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
