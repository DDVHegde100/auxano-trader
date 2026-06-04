import type { StrategyLogic } from "./types";

/** Blocks → Python only (one-way). */
export function blocksToPython(logic: StrategyLogic): string {
  const lines: string[] = [
    "# Auxano strategy — generated from blocks",
    "# Edit freely; cannot convert back to blocks automatically.",
    "",
    "def on_bar(ctx):",
    '    """ctx: rsi, ma50, ma200, profit_pct, volume_ratio, position"""',
    "    signals = []",
    "",
  ];

  for (const node of logic.nodes) {
    const d = node.data;
    const indicator = String(d.indicator ?? "");
    const op = String(d.operator ?? "<");
    const threshold = Number(d.threshold ?? 30);
    const action = String(d.action ?? "HOLD").toLowerCase();

    if (indicator === "RSI") {
      lines.push(
        `    if ctx["rsi"] ${op} ${threshold}:`,
        `        signals.append("${action}")  # ${node.label}`
      );
    } else if (indicator === "MA_CROSS") {
      const cond =
        op === ">" ? 'ctx["ma50"] > ctx["ma200"]' : 'ctx["ma50"] < ctx["ma200"]';
      lines.push(`    if ${cond}:`, `        signals.append("${action}")  # ${node.label}`);
    } else if (indicator === "PROFIT") {
      lines.push(
        `    if ctx["profit_pct"] ${op} ${threshold}:`,
        `        signals.append("${action}")  # ${node.label}`
      );
    } else if (indicator === "STOP_LOSS") {
      lines.push(
        `    if ctx["profit_pct"] < -${threshold}:`,
        `        signals.append("sell")  # ${node.label}`
      );
    } else if (indicator === "TRAILING_STOP") {
      lines.push(
        `    if ctx.get("trail_drawdown_pct", 0) > ${threshold}:`,
        `        signals.append("sell")  # ${node.label}`
      );
    } else if (indicator === "VOLUME") {
      lines.push(
        `    if ctx["volume_ratio"] ${op} ${threshold}:`,
        `        signals.append("${action}")  # ${node.label}`
      );
    }
    lines.push("");
  }

  lines.push(
    '    if "sell" in signals:',
    '        return "SELL"',
    '    if "buy" in signals:',
    '        return "BUY"',
    '    return "HOLD"',
    ""
  );
  return lines.join("\n");
}

export const PYTHON_STRATEGY_STARTER = `def on_bar(ctx):
    """
    ctx keys: rsi, ma50, ma200, profit_pct, volume_ratio, position
    Return: "BUY" | "SELL" | "HOLD"
    """
    if ctx["rsi"] < 35 and ctx["position"] == 0:
        return "BUY"
    if ctx["profit_pct"] > 10:
        return "SELL"
    if ctx["profit_pct"] < -4:
        return "SELL"
    return "HOLD"
`;
