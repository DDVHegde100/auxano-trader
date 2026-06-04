import { prisma, OrderSide } from "@auxano/database";
import {
  validateOrder,
  computeRealizedPnl,
  computeNewAverageCost,
  decimalToNumber,
} from "@auxano/shared";
import { recordPortfolioSnapshot } from "./portfolio";

export async function executePaperTrade(params: {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
}) {
  const account = await prisma.paperAccount.findUnique({
    where: { userId: params.userId },
    include: { positions: true },
  });
  if (!account) throw new Error("Account not found");

  const quote = await prisma.marketQuote.findUnique({
    where: { symbol: params.symbol.toUpperCase() },
  });
  if (!quote) throw new Error("Symbol not found");

  const price = decimalToNumber(quote.price);
  const cash = decimalToNumber(account.cashBalance);
  const existing = account.positions.find(
    (p) => p.symbol === params.symbol.toUpperCase()
  );
  const posQty = existing ? decimalToNumber(existing.quantity) : 0;

  const validation = validateOrder({
    side: params.side,
    quantity: params.quantity,
    price,
    cashBalance: cash,
    positionQuantity: posQty,
  });
  if (!validation.valid) throw new Error(validation.error);

  const symbol = params.symbol.toUpperCase();
  const side = params.side as OrderSide;

  const order = await prisma.order.create({
    data: {
      accountId: account.id,
      symbol,
      side,
      quantity: params.quantity,
      status: "FILLED",
      filledPrice: price,
      filledAt: new Date(),
    },
  });

  let realizedPnl = 0;
  if (side === "BUY") {
    const cost = params.quantity * price;
    await prisma.paperAccount.update({
      where: { id: account.id },
      data: { cashBalance: cash - cost },
    });

    if (existing) {
      const newAvg = computeNewAverageCost(
        posQty,
        decimalToNumber(existing.averageCost),
        params.quantity,
        price
      );
      await prisma.position.update({
        where: { id: existing.id },
        data: {
          quantity: posQty + params.quantity,
          averageCost: newAvg,
        },
      });
    } else {
      await prisma.position.create({
        data: {
          accountId: account.id,
          symbol,
          quantity: params.quantity,
          averageCost: price,
        },
      });
    }
  } else {
    const proceeds = params.quantity * price;
    const avgCost = decimalToNumber(existing!.averageCost);
    realizedPnl = computeRealizedPnl("SELL", params.quantity, price, avgCost);

    await prisma.paperAccount.update({
      where: { id: account.id },
      data: {
        cashBalance: cash + proceeds,
        realizedPnl: decimalToNumber(account.realizedPnl) + realizedPnl,
      },
    });

    const remaining = posQty - params.quantity;
    if (remaining <= 0) {
      await prisma.position.delete({ where: { id: existing!.id } });
    } else {
      await prisma.position.update({
        where: { id: existing!.id },
        data: { quantity: remaining },
      });
    }
  }

  await prisma.trade.create({
    data: {
      accountId: account.id,
      orderId: order.id,
      symbol,
      side,
      quantity: params.quantity,
      price,
      realizedPnl,
    },
  });

  await recordPortfolioSnapshot(account.id);

  return { orderId: order.id, price, realizedPnl };
}
