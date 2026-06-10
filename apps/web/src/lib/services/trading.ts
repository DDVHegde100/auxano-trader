import { prisma, OrderSide } from "@auxano/database";
import {
  validateOrder,
  quantityFromNotional,
  computeRealizedPnl,
  computeNewAverageCost,
  decimalToNumber,
} from "@auxano/shared";
import { recordPortfolioSnapshot } from "./portfolio";
import { getOrFetchQuote } from "./market";
import { refreshLeaderboardQuotes } from "./leaderboard";
import { getTraderRank, notifyLeaderboardPassesAfterTrade } from "./leaderboard-ranks";
import { notifyTradeFill } from "./notifications";
import { finalizeExpiredDuels } from "./competitions";
import { assertCanBuySymbol } from "./strategy-trade";

export async function executePaperTrade(params: {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity?: number;
  amountUsd?: number;
  strategyId?: string;
  presetId?: string;
  strategyDeploymentId?: string;
  source?: "MANUAL" | "AUTOPILOT";
}) {
  const account = await prisma.paperAccount.findUnique({
    where: { userId: params.userId },
    include: { positions: true },
  });
  if (!account) throw new Error("Account not found");

  const symbol = params.symbol.toUpperCase();

  if (params.side === "BUY") {
    await assertCanBuySymbol({
      userId: params.userId,
      symbol,
      strategyId: params.strategyId,
      presetId: params.presetId,
    });
  }

  const live = await getOrFetchQuote(symbol);
  const quote = await prisma.marketQuote.findUnique({ where: { symbol } });
  if (!live && !quote) throw new Error("Symbol not found — search and select a valid ticker");

  const price = live?.price ?? decimalToNumber(quote!.price);
  const cash = decimalToNumber(account.cashBalance);
  const existing = account.positions.find((p) => p.symbol === symbol);
  const posQty = existing ? decimalToNumber(existing.quantity) : 0;

  let quantity = params.quantity ?? 0;
  if (params.amountUsd != null) {
    const fromNotional = quantityFromNotional(params.amountUsd, price, params.side, {
      cashBalance: cash,
      positionQuantity: posQty,
    });
    if (fromNotional.error) throw new Error(fromNotional.error);
    quantity = fromNotional.quantity;
  }

  const validation = validateOrder({
    side: params.side,
    quantity,
    price,
    cashBalance: cash,
    positionQuantity: posQty,
  });
  if (!validation.valid) throw new Error(validation.error);

  const side = params.side as OrderSide;
  const rankBefore = await getTraderRank(params.userId);

  const tradeSource = params.source ?? "MANUAL";

  const order = await prisma.order.create({
    data: {
      accountId: account.id,
      symbol,
      side,
      quantity,
      status: "FILLED",
      filledPrice: price,
      filledAt: new Date(),
      source: tradeSource,
      strategyDeploymentId: params.strategyDeploymentId ?? null,
    },
  });

  let realizedPnl = 0;
  if (side === "BUY") {
    const cost = quantity * price;
    await prisma.paperAccount.update({
      where: { id: account.id },
      data: { cashBalance: cash - cost },
    });

    if (existing) {
      const newAvg = computeNewAverageCost(
        posQty,
        decimalToNumber(existing.averageCost),
        quantity,
        price
      );
      await prisma.position.update({
        where: { id: existing.id },
        data: {
          quantity: posQty + quantity,
          averageCost: newAvg,
        },
      });
    } else {
      await prisma.position.create({
        data: {
          accountId: account.id,
          symbol,
          quantity,
          averageCost: price,
        },
      });
    }
  } else {
    const proceeds = quantity * price;
    const avgCost = decimalToNumber(existing!.averageCost);
    realizedPnl = computeRealizedPnl("SELL", quantity, price, avgCost);

    await prisma.paperAccount.update({
      where: { id: account.id },
      data: {
        cashBalance: cash + proceeds,
        realizedPnl: decimalToNumber(account.realizedPnl) + realizedPnl,
      },
    });

    const remaining = posQty - quantity;
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
      quantity,
      price,
      realizedPnl,
      source: tradeSource,
      strategyDeploymentId: params.strategyDeploymentId ?? null,
    },
  });

  await recordPortfolioSnapshot(account.id);

  refreshLeaderboardQuotes().catch(() => {});

  if (tradeSource === "MANUAL") {
    notifyTradeFill({
      userId: params.userId,
      symbol,
      side: params.side,
      quantity,
      price,
    }).catch(() => {});
  }

  const rankAfter = await getTraderRank(params.userId);
  notifyLeaderboardPassesAfterTrade(params.userId, rankBefore, rankAfter).catch(
    () => {}
  );

  finalizeExpiredDuels().catch(() => {});

  return { orderId: order.id, price, realizedPnl, leaderboardRefresh: true };
}
