import type { StrategyLogic, StrategyMeta } from "./types";

export type AssetType = StrategyMeta["assetTypes"][number];

export const DEFAULT_STRATEGY_META: StrategyMeta = {
  symbolScope: "universal",
  symbols: [],
  assetTypes: ["STOCK", "ETF", "INDEX", "OPTION", "FUTURE"],
  builderMode: "blocks",
};

export function parseLogicWithMeta(logic: StrategyLogic): {
  nodes: StrategyLogic["nodes"];
  edges: StrategyLogic["edges"];
  meta: StrategyMeta;
} {
  const meta = { ...DEFAULT_STRATEGY_META, ...(logic.meta ?? {}) };
  return { nodes: logic.nodes ?? [], edges: logic.edges ?? [], meta };
}

export function canTradeSymbol(meta: StrategyMeta, symbol: string): boolean {
  const sym = symbol.toUpperCase();
  if (meta.symbolScope === "universal") return true;
  return meta.symbols.map((s) => s.toUpperCase()).includes(sym);
}

export function logicWithMeta(
  nodes: StrategyLogic["nodes"],
  edges: StrategyLogic["edges"],
  meta: Partial<StrategyMeta>
): StrategyLogic {
  return {
    nodes,
    edges,
    meta: { ...DEFAULT_STRATEGY_META, ...meta },
  };
}
