"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { StockSearch, type SearchQuote } from "@/components/auxano/stock-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  getSelectedPresetFromStorage,
  setSelectedPresetInStorage,
} from "@/lib/services/preset-trade";
import { getPresetById } from "@auxano/shared";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

interface TradeOption {
  id: string;
  name: string;
  strategyId?: string;
  symbols?: string[];
  scope?: string;
}

interface TradeLimits {
  cashBalance: number;
  price: number;
  maxBuyUsd: number;
  maxSellUsd: number;
  positionShares: number;
}

function TradePageInner() {
  const searchParams = useSearchParams();
  const presetFromUrl = searchParams.get("preset");

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState("AAPL");
  const [quoteDetail, setQuoteDetail] = useState<Quote | null>(null);
  const [amountUsd, setAmountUsd] = useState("");
  const [limits, setLimits] = useState<TradeLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [tradeOptions, setTradeOptions] = useState<{
    presets: TradeOption[];
    strategies: TradeOption[];
    deployments: TradeOption[];
  }>({ presets: [], strategies: [], deployments: [] });
  const [strategyKey, setStrategyKey] = useState("");

  const activePresetId = strategyKey.startsWith("preset:")
    ? strategyKey.replace("preset:", "")
    : null;

  const activePreset = activePresetId ? getPresetById(activePresetId) : null;

  const allowedSymbols = useMemo(() => {
    if (!activePreset) return null;
    if (activePreset.logic.meta?.symbolScope === "universal") return null;
    return activePreset.suggestedSymbols;
  }, [activePreset]);

  const tradableQuotes = useMemo(() => {
    if (!allowedSymbols) return quotes;
    const set = new Set(allowedSymbols.map((s) => s.toUpperCase()));
    const filtered = quotes.filter((q) => set.has(q.symbol));
    return filtered.length > 0 ? filtered : quotes.filter((q) => set.has(q.symbol));
  }, [quotes, allowedSymbols]);

  const loadQuotes = useCallback(() => {
    fetch("/api/market/quotes")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(Array.isArray(d.quotes) ? d.quotes : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadQuoteDetail = useCallback((symbol: string) => {
    fetch(`/api/market/quotes?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.symbol) {
          setQuoteDetail({
            symbol: d.symbol,
            name: d.name,
            price: d.price,
            changePct: d.changePct,
          });
        }
      });
  }, []);

  const loadLimits = useCallback((symbol: string) => {
    fetch(`/api/trading/max-buy?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.cashBalance != null) {
          setLimits({
            cashBalance: d.cashBalance,
            price: d.price,
            maxBuyUsd: d.maxBuyUsd ?? d.maxCost ?? 0,
            maxSellUsd: d.maxSellUsd ?? 0,
            positionShares: d.positionShares ?? 0,
          });
        }
      })
      .catch(() => setLimits(null));
  }, []);

  useEffect(() => {
    loadQuotes();
    fetch("/api/strategies/trade-options")
      .then((r) => r.json())
      .then((d) => {
        setTradeOptions(d);
        const stored = getSelectedPresetFromStorage();
        const initial = presetFromUrl ?? stored;
        if (initial) {
          setStrategyKey(`preset:${initial}`);
          setSelectedPresetInStorage(initial);
          const p = getPresetById(initial);
          if (p?.suggestedSymbols[0] && p.logic.meta?.symbolScope !== "universal") {
            setSelected(p.suggestedSymbols[0]);
          }
        } else if (d.presets?.[0]) {
          setStrategyKey(d.presets[0].id);
        }
      });
    const iv = setInterval(loadQuotes, 30_000);
    return () => clearInterval(iv);
  }, [loadQuotes, presetFromUrl]);

  useEffect(() => {
    if (allowedSymbols?.length && !allowedSymbols.includes(selected)) {
      setSelected(allowedSymbols[0]);
    }
  }, [allowedSymbols, selected]);

  useEffect(() => {
    loadQuoteDetail(selected);
    loadLimits(selected);
  }, [selected, loadQuoteDetail, loadLimits]);

  const quote =
    quoteDetail ?? tradableQuotes.find((q) => q.symbol === selected) ?? null;

  const price = quote?.price ?? limits?.price ?? 0;
  const amountNum = Number(amountUsd) || 0;
  const estShares =
    price > 0 && amountNum > 0 ? Math.floor(amountNum / price) : 0;

  function onSearchSelect(item: SearchQuote) {
    if (allowedSymbols && !allowedSymbols.includes(item.symbol)) {
      setMsg(`This DEFAULT algorithm only trades: ${allowedSymbols.join(", ")}`);
      return;
    }
    setSelected(item.symbol);
    loadQuoteDetail(item.symbol);
    setMsg("");
  }

  function parseStrategyPayload() {
    if (strategyKey.startsWith("preset:")) {
      return { presetId: strategyKey.replace("preset:", "") };
    }
    return { strategyId: strategyKey };
  }

  function setAmountFromPct(side: "BUY" | "SELL", pct: number) {
    if (!limits) return;
    const cap = side === "BUY" ? limits.maxBuyUsd : limits.maxSellUsd;
    setAmountUsd(String(Math.floor(cap * pct * 100) / 100));
  }

  async function trade(side: "BUY" | "SELL") {
    setMsg("");
    if (side === "BUY" && !strategyKey) {
      setMsg("Select a DEFAULT algorithm before buying.");
      return;
    }
    const amount = Number(amountUsd);
    if (!amount || amount <= 0) {
      setMsg("Enter a dollar amount to trade.");
      return;
    }
    const res = await fetch("/api/trading/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: selected,
        side,
        amountUsd: amount,
        ...parseStrategyPayload(),
      }),
    });
    const data = await res.json();
    setMsg(
      data.error ??
        `${side} filled · ~${estShares} share(s) at ${formatCurrency(data.price)}`
    );
    if (!data.error) {
      loadQuotes();
      loadLimits(selected);
      setAmountUsd("");
    }
  }

  const allOptions = [
    ...tradeOptions.presets,
    ...tradeOptions.deployments.map((d) => ({
      id: d.strategyId ?? d.id,
      name: `${d.name} (deployed)`,
    })),
    ...tradeOptions.strategies,
  ];

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="aux-container-narrow aux-stack">
      <header className="aux-section-header">
        <h1 className="aux-h1">Paper Trade</h1>
        <p>Trade by dollar amount · live prices · DEFAULT algorithms</p>
      </header>

      {activePreset && (
        <div className="aux-pill border border-[var(--border-strong)]">
          <span className="text-sm text-accent">DEFAULT · {activePreset.name}</span>
          <span className="text-xs text-muted">
            {activePreset.logic.meta?.symbolScope === "universal"
              ? " · any symbol"
              : ` · ${activePreset.suggestedSymbols.join(", ")}`}
          </span>
        </div>
      )}

      {limits && (
        <p className="text-sm text-muted">
          Buying power:{" "}
          <span className="text-foreground font-medium tabular-nums">
            {formatCurrency(limits.cashBalance)}
          </span>
          {limits.positionShares > 0 && (
            <>
              {" "}
              · Position value:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {formatCurrency(limits.maxSellUsd)}
              </span>
            </>
          )}
        </p>
      )}

      <StockSearch onSelect={onSearchSelect} />

      <GlassCard glow>
        <label className="aux-label">Symbol</label>
        <select
          className="aux-select mt-2 text-lg"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {tradableQuotes.map((q) => (
            <option key={q.symbol} value={q.symbol}>
              {q.symbol} — {q.name}
            </option>
          ))}
          {!tradableQuotes.some((q) => q.symbol === selected) && (
            <option value={selected}>{selected}</option>
          )}
        </select>

        {quote && (
          <div className="mt-6">
            <p className="text-4xl tabular-nums text-gradient-accent">
              {formatCurrency(quote.price)}
            </p>
            <p
              className={
                quote.changePct >= 0 ? "text-positive text-sm" : "text-negative text-sm"
              }
            >
              {quote.changePct >= 0 ? "+" : ""}
              {quote.changePct.toFixed(2)}% today
            </p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--accent-muted)] p-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            DEFAULT algorithm (required for buys)
            <Info className="h-3.5 w-3.5 text-accent" aria-label="Strategy rules apply to allowed assets only" />
          </label>
          <select
            className="aux-select mt-2"
            value={strategyKey}
            onChange={(e) => {
              setStrategyKey(e.target.value);
              const id = e.target.value.replace("preset:", "");
              if (e.target.value.startsWith("preset:")) {
                setSelectedPresetInStorage(id);
                const p = getPresetById(id);
                if (
                  p &&
                  p.logic.meta?.symbolScope !== "universal" &&
                  p.suggestedSymbols[0]
                ) {
                  setSelected(p.suggestedSymbols[0]);
                }
              }
            }}
          >
            <option value="">— Select DEFAULT algorithm —</option>
            {allOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <label className="aux-label">Amount (USD)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            className="mt-2"
            placeholder="0.00"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
          />
          {estShares > 0 && price > 0 && (
            <p className="mt-2 text-xs text-muted">
              ≈ {estShares} share{estShares !== 1 ? "s" : ""} at{" "}
              {formatCurrency(price)} per share
            </p>
          )}
          {limits && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="aux-chip text-xs"
                onClick={() => setAmountFromPct("BUY", 0.25)}
              >
                25% cash
              </button>
              <button
                type="button"
                className="aux-chip text-xs"
                onClick={() => setAmountFromPct("BUY", 0.5)}
              >
                50% cash
              </button>
              <button
                type="button"
                className="aux-chip text-xs"
                onClick={() => setAmountFromPct("BUY", 1)}
              >
                Max buy
              </button>
              {limits.maxSellUsd > 0 && (
                <button
                  type="button"
                  className="aux-chip text-xs"
                  onClick={() => setAmountFromPct("SELL", 1)}
                >
                  Sell all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="primary" size="lg" onClick={() => trade("BUY")}>
            Buy
          </Button>
          <Button variant="danger" size="lg" onClick={() => trade("SELL")}>
            Sell
          </Button>
        </div>

        {msg && <p className="mt-4 text-center text-sm text-muted">{msg}</p>}
      </GlassCard>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <TradePageInner />
    </Suspense>
  );
}
