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
    meta: { name: string; description: string }
  ) {
    setSaving(true);
    const bt = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: meta.name,
        logicJson: logic,
        symbol: "AAPL",
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
        isPublished: true,
      }),
    }).then((r) => r.json());

    setSaving(false);
    if (res.strategy?.slug) {
      router.push(`/strategies/${res.strategy.slug}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Strategy Builder</h1>
        <p className="text-[#B0B0B0]">
          Visual no-code blocks · stored as JSON · auto-backtested
        </p>
      </div>

      <GlassCard glow>
        <StrategyBuilder onSave={handleSave} />
        {saving && (
          <p className="mt-4 text-center text-sm text-[#B0B0B0]">
            Running backtest & saving...
          </p>
        )}
      </GlassCard>

      {backtestResult && (
        <GlassCard>
          <h3 className="font-semibold">Backtest Preview</h3>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#00C853]">
                {backtestResult.quantScore?.total ?? 0}
              </p>
              <p className="text-xs text-[#B0B0B0]">Quant Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {backtestResult.metrics?.annualReturn?.toFixed(1)}%
              </p>
              <p className="text-xs text-[#B0B0B0]">Annual Return</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {backtestResult.metrics?.sharpeRatio?.toFixed(2)}
              </p>
              <p className="text-xs text-[#B0B0B0]">Sharpe</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
