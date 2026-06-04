export interface BlockDefinition {
  id: string;
  label: string;
  indicator: string;
  defaultData: Record<string, string | number | boolean>;
  params: { key: string; label: string; type: "number" | "select"; options?: string[] }[];
  info: string;
}

export const BLOCK_CATALOG: BlockDefinition[] = [
  {
    id: "rsi-oversold",
    label: "RSI Oversold Buy",
    indicator: "RSI",
    defaultData: { indicator: "RSI", operator: "<", threshold: 30, action: "BUY" },
    params: [
      { key: "threshold", label: "RSI level", type: "number" },
      {
        key: "action",
        label: "Action",
        type: "select",
        options: ["BUY", "SELL"],
      },
    ],
    info: "Buys when RSI is below your threshold — often means the stock sold off and may bounce (mean reversion).",
  },
  {
    id: "rsi-overbought",
    label: "RSI Overbought Sell",
    indicator: "RSI",
    defaultData: { indicator: "RSI", operator: ">", threshold: 70, action: "SELL" },
    params: [{ key: "threshold", label: "RSI level", type: "number" }],
    info: "Sells when RSI is high — price may be stretched short term.",
  },
  {
    id: "golden-cross",
    label: "Golden Cross Buy",
    indicator: "MA_CROSS",
    defaultData: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
    params: [],
    info: "Buys when the 50-day average crosses above the 200-day — classic uptrend signal.",
  },
  {
    id: "death-cross",
    label: "Death Cross Sell",
    indicator: "MA_CROSS",
    defaultData: { indicator: "MA_CROSS", operator: "<", action: "SELL" },
    params: [],
    info: "Sells when short-term trend falls below long-term trend.",
  },
  {
    id: "take-profit",
    label: "Take Profit",
    indicator: "PROFIT",
    defaultData: { indicator: "PROFIT", operator: ">", threshold: 12, action: "SELL" },
    params: [{ key: "threshold", label: "Profit %", type: "number" }],
    info: "Locks in gains when open profit exceeds your target percent.",
  },
  {
    id: "stop-loss",
    label: "Stop Loss",
    indicator: "STOP_LOSS",
    defaultData: { indicator: "STOP_LOSS", operator: ">", threshold: 5, action: "SELL" },
    params: [{ key: "threshold", label: "Max loss %", type: "number" }],
    info: "Exits when unrealized loss exceeds this percent — protects capital.",
  },
  {
    id: "trailing-stop",
    label: "Trailing Stop",
    indicator: "TRAILING_STOP",
    defaultData: { indicator: "TRAILING_STOP", operator: ">", threshold: 4, action: "SELL" },
    params: [{ key: "threshold", label: "Trail %", type: "number" }],
    info: "Sells if price falls this percent from the highest price since you bought.",
  },
  {
    id: "volume-spike",
    label: "Volume Confirmation",
    indicator: "VOLUME",
    defaultData: { indicator: "VOLUME", operator: ">", threshold: 1.5, action: "BUY" },
    params: [{ key: "threshold", label: "Volume multiple", type: "number" }],
    info: "Only buys when volume is above average — helps confirm real moves.",
  },
];

export function getBlockInfo(indicator: string): string {
  return (
    BLOCK_CATALOG.find((b) => b.indicator === indicator)?.info ??
    "Conditional rule evaluated on each bar during backtests and paper trading."
  );
}
