import { prisma } from "@auxano/database";
import type { AutopilotRunStatus, AutopilotSignal } from "@prisma/client";
import {
  decimalToNumber,
  evaluateStrategySignal,
  buildIndicatorContext,
  parseLogicWithMeta,
  canTradeSymbol,
} from "@auxano/shared";
import type { StrategyLogic } from "@auxano/shared";
import { getQuoteDetail, getOrFetchQuote } from "./market";
import { executePaperTrade } from "./trading";
import { notifyAutopilotError, notifyAutopilotTrade } from "./notifications";

const MAX_DEPLOYMENTS_PER_CRON = 40;
const ERROR_PAUSE_THRESHOLD = 5;

export function resolvePrimarySymbol(
  logic: StrategyLogic,
  fallback: string
): string {
  const { meta } = parseLogicWithMeta(logic);
  if (meta.symbolScope !== "universal" && meta.symbols.length > 0) {
    return meta.symbols[0].toUpperCase();
  }
  return fallback.toUpperCase();
}

async function fetchClosesForSymbol(symbol: string): Promise<number[]> {
  const detail = await getQuoteDetail(symbol);
  const live = await getOrFetchQuote(symbol);
  const current = live?.price ?? detail?.price ?? 100;
  const history = detail?.history?.map((h) => h.close) ?? [];
  const closes = [...history, current];
  if (closes.length < 55) {
    const pad = 55 - closes.length;
    const base = closes[0] ?? current;
    const padded = Array.from({ length: pad }, (_, i) => base * (1 - 0.001 * (pad - i)));
    return [...padded, ...closes];
  }
  return closes;
}

export async function enrichDeployment(
  deployment: {
    id: string;
    strategyId: string;
    userId: string;
    isActive: boolean;
    allocated: { toString(): string };
    autopilotEnabled: boolean;
    autopilotStatus: string;
    intervalMinutes: number;
    primarySymbol: string;
    presetKey: string | null;
    lastRunAt: Date | null;
    nextRunAt: Date | null;
    lastSignal: AutopilotSignal | null;
    lastSignalAt: Date | null;
    lastError: string | null;
    consecutiveErrors: number;
    pausedAt: Date | null;
    pausedReason: string | null;
    totalRuns: number;
    totalAutopilotTrades: number;
    attributedRealizedPnl: { toString(): string };
    createdAt: Date;
    updatedAt: Date;
    strategy: {
      id: string;
      name: string;
      slug: string;
      logicJson: unknown;
      quantScore: number;
      category: string;
    };
  },
  userId: string
) {
  const symbol = deployment.primarySymbol.toUpperCase();
  const account = await prisma.paperAccount.findUnique({
    where: { userId },
    include: { positions: true },
  });
  const pos = account?.positions.find((p) => p.symbol === symbol);
  const quote = await getOrFetchQuote(symbol);
  const price = quote?.price ?? 0;
  const qty = pos ? decimalToNumber(pos.quantity) : 0;
  const avg = pos ? decimalToNumber(pos.averageCost) : 0;
  const positionValue = qty * price;
  const allocated = decimalToNumber(deployment.allocated);
  const unrealizedPnl = qty > 0 ? (price - avg) * qty : 0;
  const utilizationPct =
    allocated > 0 ? (positionValue / allocated) * 100 : 0;

  const recentRuns = await prisma.autopilotRun.findMany({
    where: { deploymentId: deployment.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return {
    id: deployment.id,
    strategyId: deployment.strategyId,
    strategyName: deployment.strategy.name,
    strategySlug: deployment.strategy.slug,
    quantScore: deployment.strategy.quantScore,
    category: deployment.strategy.category,
    isActive: deployment.isActive,
    allocated,
    autopilotEnabled: deployment.autopilotEnabled,
    autopilotStatus: deployment.autopilotStatus,
    intervalMinutes: deployment.intervalMinutes,
    primarySymbol: symbol,
    presetKey: deployment.presetKey,
    lastRunAt: deployment.lastRunAt?.toISOString() ?? null,
    nextRunAt: deployment.nextRunAt?.toISOString() ?? null,
    lastSignal: deployment.lastSignal,
    lastSignalAt: deployment.lastSignalAt?.toISOString() ?? null,
    lastError: deployment.lastError,
    consecutiveErrors: deployment.consecutiveErrors,
    pausedAt: deployment.pausedAt?.toISOString() ?? null,
    pausedReason: deployment.pausedReason,
    totalRuns: deployment.totalRuns,
    totalAutopilotTrades: deployment.totalAutopilotTrades,
    attributedRealizedPnl: decimalToNumber(deployment.attributedRealizedPnl),
    unrealizedPnl,
    positionValue,
    utilizationPct,
    hasPosition: qty > 0,
    positionQty: qty,
    currentPrice: price,
    recentRuns: recentRuns.map((r) => ({
      id: r.id,
      status: r.status,
      signal: r.signal,
      symbol: r.symbol,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
      tradeId: r.tradeId,
    })),
  };
}

export async function listUserBots(userId: string) {
  const deployments = await prisma.strategyDeployment.findMany({
    where: { userId },
    include: {
      strategy: {
        select: {
          id: true,
          name: true,
          slug: true,
          logicJson: true,
          quantScore: true,
          category: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(deployments.map((d) => enrichDeployment(d, userId)));
}

export async function getBotDetail(deploymentId: string, userId: string) {
  const d = await prisma.strategyDeployment.findFirst({
    where: { id: deploymentId, userId },
    include: {
      strategy: {
        select: {
          id: true,
          name: true,
          slug: true,
          logicJson: true,
          quantScore: true,
          category: true,
        },
      },
    },
  });
  if (!d) return null;

  const bot = await enrichDeployment(d, userId);
  const runs = await prisma.autopilotRun.findMany({
    where: { deploymentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    ...bot,
    runs: runs.map((r) => ({
      id: r.id,
      status: r.status,
      signal: r.signal,
      symbol: r.symbol,
      message: r.message,
      indicators: r.indicators,
      tradeId: r.tradeId,
      errorCode: r.errorCode,
      durationMs: r.durationMs,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function configureAutopilotOnDeploy(params: {
  deploymentId: string;
  logic: StrategyLogic;
  presetKey?: string;
  primarySymbol?: string;
  intervalMinutes?: number;
}) {
  const symbol = params.primarySymbol
    ? params.primarySymbol.toUpperCase()
    : resolvePrimarySymbol(params.logic, "AAPL");
  const next = new Date();

  await prisma.strategyDeployment.update({
    where: { id: params.deploymentId },
    data: {
      autopilotEnabled: true,
      autopilotStatus: "RUNNING",
      primarySymbol: symbol,
      presetKey: params.presetKey ?? null,
      intervalMinutes: params.intervalMinutes ?? 10,
      nextRunAt: next,
      consecutiveErrors: 0,
      lastError: null,
      pausedAt: null,
      pausedReason: null,
    },
  });
}

export async function updateBotSettings(
  deploymentId: string,
  userId: string,
  patch: {
    autopilotEnabled?: boolean;
    autopilotStatus?: "RUNNING" | "PAUSED";
    intervalMinutes?: number;
    allocated?: number;
    primarySymbol?: string;
  }
) {
  const d = await prisma.strategyDeployment.findFirst({
    where: { id: deploymentId, userId },
  });
  if (!d) throw new Error("Bot not found");

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.allocated != null) data.allocated = patch.allocated;
  if (patch.primarySymbol) data.primarySymbol = patch.primarySymbol.toUpperCase();
  if (patch.intervalMinutes != null) {
    data.intervalMinutes = Math.min(60, Math.max(5, patch.intervalMinutes));
  }
  if (patch.autopilotEnabled !== undefined) {
    data.autopilotEnabled = patch.autopilotEnabled;
  }
  if (patch.autopilotStatus === "PAUSED") {
    data.autopilotStatus = "PAUSED";
    data.pausedAt = new Date();
    data.pausedReason = "Paused by user";
  }
  if (patch.autopilotStatus === "RUNNING") {
    data.autopilotStatus = "RUNNING";
    data.autopilotEnabled = true;
    data.consecutiveErrors = 0;
    data.lastError = null;
    data.pausedAt = null;
    data.pausedReason = null;
    const next = new Date();
    next.setMinutes(next.getMinutes() + (d.intervalMinutes || 10));
    data.nextRunAt = next;
  }

  return prisma.strategyDeployment.update({
    where: { id: deploymentId },
    data,
  });
}

async function recordRun(params: {
  deploymentId: string;
  status: AutopilotRunStatus;
  signal: AutopilotSignal;
  symbol: string;
  message?: string;
  indicators?: Record<string, number>;
  tradeId?: string;
  errorCode?: string;
  durationMs?: number;
}) {
  return prisma.autopilotRun.create({
    data: {
      deploymentId: params.deploymentId,
      status: params.status,
      signal: params.signal,
      symbol: params.symbol,
      message: params.message,
      indicators: params.indicators ?? undefined,
      tradeId: params.tradeId,
      errorCode: params.errorCode,
      durationMs: params.durationMs,
    },
  });
}

async function recentAutopilotBuy(deploymentId: string, symbol: string, since: Date) {
  const t = await prisma.trade.findFirst({
    where: {
      strategyDeploymentId: deploymentId,
      symbol,
      side: "BUY",
      source: "AUTOPILOT",
      executedAt: { gte: since },
    },
    orderBy: { executedAt: "desc" },
  });
  return !!t;
}

export async function runDeploymentAutopilot(deploymentId: string): Promise<{
  ok: boolean;
  signal: AutopilotSignal;
  message: string;
}> {
  const started = Date.now();
  const deployment = await prisma.strategyDeployment.findUnique({
    where: { id: deploymentId },
    include: {
      strategy: true,
      user: { include: { paperAccount: { include: { positions: true } } } },
    },
  });

  if (!deployment) {
    return { ok: false, signal: "HOLD", message: "Deployment not found" };
  }

  if (!deployment.isActive || !deployment.autopilotEnabled) {
    return { ok: false, signal: "HOLD", message: "Autopilot disabled" };
  }

  if (deployment.autopilotStatus === "PAUSED") {
    return { ok: false, signal: "HOLD", message: "Paused" };
  }

  const logic = deployment.strategy.logicJson as unknown as StrategyLogic;
  const { meta } = parseLogicWithMeta(logic);
  const symbol = deployment.primarySymbol.toUpperCase();

  if (!canTradeSymbol(meta, symbol)) {
    const msg = `${symbol} not allowed for this strategy`;
    await recordRun({
      deploymentId,
      status: "ERROR",
      signal: "HOLD",
      symbol,
      message: msg,
      errorCode: "SYMBOL",
      durationMs: Date.now() - started,
    });
    await bumpError(deployment.id, deployment.userId, deployment.strategy.name, msg);
    return { ok: false, signal: "HOLD", message: msg };
  }

  try {
    const closes = await fetchClosesForSymbol(symbol);
    const account = deployment.user.paperAccount;
    if (!account) throw new Error("Paper account required");

    const pos = account.positions.find((p) => p.symbol === symbol);
    const quote = await getOrFetchQuote(symbol);
    const price = quote?.price ?? closes[closes.length - 1] ?? 0;
    const qty = pos ? decimalToNumber(pos.quantity) : 0;
    const avg = pos ? decimalToNumber(pos.averageCost) : 0;

    const indicators = buildIndicatorContext(closes, {
      quantity: qty,
      averageCost: avg,
      currentPrice: price,
    });

    const signal = evaluateStrategySignal(logic, indicators) as AutopilotSignal;
    const indicatorSnap = {
      rsi: Math.round(indicators.rsi * 10) / 10,
      ma50: Math.round(indicators.ma50 * 100) / 100,
      ma200: Math.round(indicators.ma200 * 100) / 100,
      profitPct: Math.round(indicators.profitPct * 10) / 10,
    };

    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + deployment.intervalMinutes);

    await prisma.strategyDeployment.update({
      where: { id: deploymentId },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun,
        lastSignal: signal,
        lastSignalAt: new Date(),
        totalRuns: { increment: 1 },
        consecutiveErrors: 0,
        lastError: null,
        autopilotStatus: "RUNNING",
      },
    });

    if (signal === "HOLD") {
      await recordRun({
        deploymentId,
        status: "SUCCESS",
        signal,
        symbol,
        message: "No trade — conditions not met",
        indicators: indicatorSnap,
        durationMs: Date.now() - started,
      });
      return { ok: true, signal, message: "HOLD" };
    }

    const allocated = decimalToNumber(deployment.allocated);
    const cash = decimalToNumber(account.cashBalance);
    const positionValue = qty * price;
    const cooldownSince = new Date();
    cooldownSince.setMinutes(
      cooldownSince.getMinutes() - deployment.intervalMinutes
    );

    if (signal === "BUY") {
      if (qty > 0 && positionValue >= allocated * 0.98) {
        await recordRun({
          deploymentId,
          status: "SKIPPED",
          signal,
          symbol,
          message: "Allocation full",
          indicators: indicatorSnap,
          durationMs: Date.now() - started,
        });
        return { ok: true, signal, message: "Allocation full" };
      }

      if (await recentAutopilotBuy(deploymentId, symbol, cooldownSince)) {
        await recordRun({
          deploymentId,
          status: "SKIPPED",
          signal,
          symbol,
          message: "Cooldown — recent autopilot buy",
          indicators: indicatorSnap,
          durationMs: Date.now() - started,
        });
        return { ok: true, signal, message: "Cooldown" };
      }

      const headroom = Math.max(0, allocated - positionValue);
      const buyBudget = Math.min(headroom * 0.4, cash * 0.15, allocated * 0.25);
      if (buyBudget < price * 1) {
        await recordRun({
          deploymentId,
          status: "SKIPPED",
          signal,
          symbol,
          message: "Insufficient cash or allocation headroom",
          indicators: indicatorSnap,
          durationMs: Date.now() - started,
        });
        return { ok: true, signal, message: "Insufficient funds" };
      }

      const tradeResult = await executePaperTrade({
        userId: deployment.userId,
        symbol,
        side: "BUY",
        amountUsd: buyBudget,
        strategyId: deployment.strategyId,
        strategyDeploymentId: deploymentId,
        source: "AUTOPILOT",
      });

      const trade = await prisma.trade.findFirst({
        where: { orderId: tradeResult.orderId },
      });

      await prisma.strategyDeployment.update({
        where: { id: deploymentId },
        data: { totalAutopilotTrades: { increment: 1 } },
      });

      await recordRun({
        deploymentId,
        status: "TRADED",
        signal,
        symbol,
        message: `BUY ~$${buyBudget.toFixed(0)} @ ${tradeResult.price.toFixed(2)}`,
        indicators: indicatorSnap,
        tradeId: trade?.id,
        durationMs: Date.now() - started,
      });

      await notifyAutopilotTrade({
        userId: deployment.userId,
        strategyName: deployment.strategy.name,
        deploymentId,
        side: "BUY",
        symbol,
        price: tradeResult.price,
      });

      return { ok: true, signal, message: "BUY executed" };
    }

    if (signal === "SELL") {
      if (qty <= 0) {
        await recordRun({
          deploymentId,
          status: "SKIPPED",
          signal,
          symbol,
          message: "No position to sell",
          indicators: indicatorSnap,
          durationMs: Date.now() - started,
        });
        return { ok: true, signal, message: "No position" };
      }

      const tradeResult = await executePaperTrade({
        userId: deployment.userId,
        symbol,
        side: "SELL",
        quantity: qty,
        strategyId: deployment.strategyId,
        strategyDeploymentId: deploymentId,
        source: "AUTOPILOT",
      });

      const trade = await prisma.trade.findFirst({
        where: { orderId: tradeResult.orderId },
      });

      await prisma.strategyDeployment.update({
        where: { id: deploymentId },
        data: {
          totalAutopilotTrades: { increment: 1 },
          attributedRealizedPnl: {
            increment: tradeResult.realizedPnl,
          },
        },
      });

      await recordRun({
        deploymentId,
        status: "TRADED",
        signal,
        symbol,
        message: `SELL ${qty} @ ${tradeResult.price.toFixed(2)} · P&L $${tradeResult.realizedPnl.toFixed(2)}`,
        indicators: indicatorSnap,
        tradeId: trade?.id,
        durationMs: Date.now() - started,
      });

      await notifyAutopilotTrade({
        userId: deployment.userId,
        strategyName: deployment.strategy.name,
        deploymentId,
        side: "SELL",
        symbol,
        price: tradeResult.price,
        realizedPnl: tradeResult.realizedPnl,
      });

      return { ok: true, signal, message: "SELL executed" };
    }

    return { ok: true, signal, message: "HOLD" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Autopilot error";
    await recordRun({
      deploymentId,
      status: "ERROR",
      signal: "HOLD",
      symbol: deployment.primarySymbol,
      message: msg,
      errorCode: "RUN",
      durationMs: Date.now() - started,
    });
    await bumpError(
      deployment.id,
      deployment.userId,
      deployment.strategy.name,
      msg
    );
    return { ok: false, signal: "HOLD", message: msg };
  }
}

async function bumpError(
  deploymentId: string,
  userId: string,
  strategyName: string,
  message: string
) {
  const d = await prisma.strategyDeployment.update({
    where: { id: deploymentId },
    data: {
      consecutiveErrors: { increment: 1 },
      lastError: message,
      lastRunAt: new Date(),
    },
  });

  if (d.consecutiveErrors >= ERROR_PAUSE_THRESHOLD) {
    await prisma.strategyDeployment.update({
      where: { id: deploymentId },
      data: {
        autopilotStatus: "ERROR",
        pausedAt: new Date(),
        pausedReason: message,
      },
    });
    await notifyAutopilotError({
      userId,
      strategyName,
      message: `Paused after ${ERROR_PAUSE_THRESHOLD} errors: ${message}`,
      deploymentId,
    });
  }
}

export async function runAutopilotCron() {
  const now = new Date();
  const due = await prisma.strategyDeployment.findMany({
    where: {
      isActive: true,
      autopilotEnabled: true,
      autopilotStatus: "RUNNING",
      OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
    },
    orderBy: { nextRunAt: "asc" },
    take: MAX_DEPLOYMENTS_PER_CRON,
    select: { id: true },
  });

  const results: { id: string; ok: boolean; message: string }[] = [];

  for (const d of due) {
    const r = await runDeploymentAutopilot(d.id);
    results.push({ id: d.id, ok: r.ok, message: r.message });
  }

  return {
    processed: results.length,
    traded: results.filter((r) => r.message.includes("executed")).length,
    results,
  };
}
