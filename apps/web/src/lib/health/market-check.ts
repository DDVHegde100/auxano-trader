import { fetchLiveQuote } from "@/lib/services/finance-api";
import type { HealthCheckResult } from "./types";

export async function checkMarketData(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const quote = await fetchLiveQuote("SPY");
    if (!quote?.price) {
      return {
        id: "market",
        name: "Market data",
        status: "warn",
        latencyMs: Date.now() - start,
        message: "SPY quote empty — check Finnhub/Yahoo",
      };
    }
    return {
      id: "market",
      name: "Market data",
      status: "pass",
      latencyMs: Date.now() - start,
      message: `Live quote OK (SPY ${quote.price.toFixed(2)})`,
      details: {
        finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY),
        provider: process.env.FINNHUB_API_KEY ? "finnhub+yahoo" : "yahoo",
      },
    };
  } catch (e) {
    return {
      id: "market",
      name: "Market data",
      status: "warn",
      latencyMs: Date.now() - start,
      message: e instanceof Error ? e.message : "Market fetch failed",
      details: {
        finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY),
      },
    };
  }
}
