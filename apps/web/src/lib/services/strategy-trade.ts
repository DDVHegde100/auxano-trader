import { prisma } from "@auxano/database";
import {
  parseLogicWithMeta,
  canTradeSymbol,
  getPresetById,
  PRESET_ALGORITHMS,
} from "@auxano/shared";
import type { StrategyLogic } from "@auxano/shared";

export async function resolveStrategyForTrade(params: {
  userId: string;
  strategyId?: string;
  presetId?: string;
}): Promise<{ logic: StrategyLogic; name: string } | null> {
  if (params.presetId) {
    const preset = getPresetById(params.presetId);
    if (!preset) return null;
    const scope = preset.logic.meta?.symbolScope ?? "symbols";
    return {
      name: preset.name,
      logic: {
        nodes: preset.logic.nodes,
        edges: preset.logic.edges,
        meta: {
          symbolScope: scope,
          symbols:
            scope === "universal" ? [] : preset.suggestedSymbols,
          assetTypes: preset.logic.meta?.assetTypes ?? [
            "STOCK",
            "ETF",
            "INDEX",
          ],
          builderMode: "blocks",
        },
      },
    };
  }

  if (!params.strategyId) return null;

  if (params.strategyId.startsWith("preset:")) {
    const preset = getPresetById(params.strategyId.replace("preset:", ""));
    if (!preset) return null;
    return { name: preset.name, logic: preset.logic };
  }

  const strategy = await prisma.strategy.findUnique({
    where: { id: params.strategyId },
  });
  if (!strategy) return null;

  return {
    name: strategy.name,
    logic: strategy.logicJson as unknown as StrategyLogic,
  };
}

export async function assertCanBuySymbol(params: {
  userId: string;
  symbol: string;
  strategyId?: string;
  presetId?: string;
}) {
  const resolved = await resolveStrategyForTrade({
    userId: params.userId,
    strategyId: params.strategyId,
    presetId: params.presetId,
  });

  if (!resolved) {
    throw new Error(
      "Select a strategy or preset before buying. Buys must match your algorithm's allowed symbols."
    );
  }

  const { meta } = parseLogicWithMeta(resolved.logic);
  if (!canTradeSymbol(meta, params.symbol)) {
    const allowed =
      meta.symbolScope === "universal"
        ? "NASDAQ-listed assets"
        : meta.symbols.join(", ");
    throw new Error(
      `${resolved.name} cannot trade ${params.symbol.toUpperCase()}. Allowed: ${allowed}.`
    );
  }
}

export function listPresetTradeOptions() {
  return PRESET_ALGORITHMS.map((p) => ({
    id: `preset:${p.id}`,
    name: `${p.name} (DEFAULT)`,
    symbols:
      p.logic.meta?.symbolScope === "universal" ? [] : p.suggestedSymbols,
    scope: p.logic.meta?.symbolScope ?? "symbols",
  }));
}
