"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { StrategyBuilder } from "@/components/auxano/strategy-builder";
import type { StrategyLogic } from "@auxano/shared";

export default function BuilderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [backtestResult, setBacktestResult] = useState<{
    quantScore: { total: number };
    metrics: { annualReturn: number; sharpeRatio: number };
  } | null>(null);

  async function handleSave(
    logic: StrategyLogic,
    meta: {
      name: string;
      description: string;
      visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
    }
  ) {
    setSaving(true);
    const bt = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: meta.name,
        logicJson: logic,
        symbol: logic.meta?.symbols?.[0] ?? "SPY",
        days: 252,
      }),
    }).then((r) => r.json());

    setBacktestResult(bt);

    const res = await fetch("/api/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: meta.name,
        description: meta.description,
        logicJson: logic,
        visibility: meta.visibility,
        isPublished: true,
      }),
    }).then((r) => r.json());

    setSaving(false);
    if (res.strategy?.slug) {
      router.push(`/strategies/${res.strategy.slug}`);
    }
  }

  return (
    <div className="aux-stack">
      <header className="aux-section-header">
        <h1 className="aux-h1">Strategy Builder</h1>
        <p>Visual blocks or Python · auto-backtested before publish</p>
      </header>

      <GlassCard glow>
        <StrategyBuilder onSave={handleSave} />
        {saving && (
          <p className="mt-4 text-center text-sm text-muted">
            Running backtest & saving...
          </p>
        )}
      </GlassCard>

      {backtestResult && (
        <GlassCard>
          <h3 className="aux-h4">Backtest Preview</h3>
          <div className="mt-4 aux-grid-3">
            <div className="aux-stat">
              <p className="aux-stat-value text-accent">
                {backtestResult.quantScore?.total ?? 0}
              </p>
              <p className="aux-stat-label">Quant Score</p>
            </div>
            <div className="aux-stat aux-stat-positive">
              <p className="aux-stat-value">
                {backtestResult.metrics?.annualReturn?.toFixed(1)}%
              </p>
              <p className="aux-stat-label">Annual Return</p>
            </div>
            <div className="aux-stat">
              <p className="aux-stat-value">
                {backtestResult.metrics?.sharpeRatio?.toFixed(2)}
              </p>
              <p className="aux-stat-label">Sharpe</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
