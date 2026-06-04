"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/auxano/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

export default function TradePage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState("AAPL");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/market/quotes")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(d);
        setLoading(false);
      });
  }, []);

  const quote = quotes.find((q) => q.symbol === selected);

  async function trade(side: "BUY" | "SELL") {
    setMsg("");
    const res = await fetch("/api/trading/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: selected,
        side,
        quantity: Number(quantity),
      }),
    });
    const data = await res.json();
    setMsg(data.error ?? `${side} filled at ${formatCurrency(data.price)}`);
  }

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Paper Trade</h1>
        <p className="text-[#B0B0B0]">Simulated execution · virtual funds only</p>
      </div>

      <GlassCard glow>
        <label className="text-sm text-[#B0B0B0]">Symbol</label>
        <select
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-lg font-semibold"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {quotes.map((q) => (
            <option key={q.symbol} value={q.symbol}>
              {q.symbol} — {q.name}
            </option>
          ))}
        </select>

        {quote && (
          <div className="mt-6">
            <p className="text-4xl font-semibold tabular-nums">
              {formatCurrency(quote.price)}
            </p>
            <p
              className={
                quote.changePct >= 0 ? "text-gain text-sm" : "text-loss text-sm"
              }
            >
              {quote.changePct >= 0 ? "+" : ""}
              {quote.changePct.toFixed(2)}% today
            </p>
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm text-[#B0B0B0]">Quantity</label>
          <Input
            type="number"
            min="1"
            className="mt-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="success"
            size="lg"
            onClick={() => trade("BUY")}
          >
            Buy
          </Button>
          <Button variant="danger" size="lg" onClick={() => trade("SELL")}>
            Sell
          </Button>
        </div>

        {msg && (
          <p className="mt-4 text-center text-sm text-[#B0B0B0]">{msg}</p>
        )}
      </GlassCard>
    </div>
  );
}
