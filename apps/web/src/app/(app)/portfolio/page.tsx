"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/auxano/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { PositionView, PortfolioSummary } from "@auxano/shared";

export default function PortfolioPage() {
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio/positions")
      .then((r) => r.json())
      .then((d) => {
        setPositions(d.positions ?? []);
        setSummary(d.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Portfolio</h1>
        {summary && (
          <p className="text-[var(--foreground-muted)]">
            {formatCurrency(summary.portfolioValue)} total ·{" "}
            <span className={summary.unrealizedPnl >= 0 ? "text-gain" : "text-loss"}>
              {formatCurrency(summary.unrealizedPnl)} unrealized
            </span>
          </p>
        )}
      </div>

      <GlassCard>
        <h2 className="mb-4 font-semibold">Positions</h2>
        {positions.length === 0 ? (
          <p className="text-[var(--foreground-muted)]">No open positions. Trade to get started.</p>
        ) : (
          <div className="space-y-4">
            {positions.map((p) => (
              <div
                key={p.symbol}
                className="flex items-center justify-between border-b border-white/[0.06] pb-4 last:border-0"
              >
                <div>
                  <p className="font-semibold">{p.symbol}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{p.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {p.quantity} shares @ {formatCurrency(p.averageCost)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(p.marketValue)}</p>
                  <p className={p.unrealizedPnl >= 0 ? "text-gain text-sm" : "text-loss text-sm"}>
                    {formatCurrency(p.unrealizedPnl)} ({formatPercent(p.unrealizedPnlPct)})
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">{p.weight.toFixed(1)}% weight</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
