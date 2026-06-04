"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/auxano/glass-card";
import { PerformanceChart } from "@/components/auxano/performance-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/stores/app-store";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Zap } from "lucide-react";

export default function DashboardPage() {
  const { dashboard, setDashboard, loading, setLoading } = useAppStore();

  useEffect(() => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setDashboard(d);
      })
      .finally(() => setLoading(false));
  }, [setDashboard, setLoading]);

  if (loading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { summary, performance, allocation, recentTrades } = dashboard;
  const up = summary.todayPnl >= 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm text-[#B0B0B0]">Portfolio Value</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {formatCurrency(summary.portfolioValue)}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          {up ? (
            <TrendingUp className="h-4 w-4 text-[#00C853]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[#FF5252]" />
          )}
          <span className={up ? "text-gain" : "text-loss"}>
            {formatCurrency(summary.todayPnl)} ({formatPercent(summary.todayPnlPct)})
            today
          </span>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Return",
            value: formatPercent(summary.totalReturnPct),
            sub: formatCurrency(summary.totalReturn),
            icon: TrendingUp,
          },
          {
            label: "Paper Cash",
            value: formatCurrency(summary.cashBalance),
            sub: "Available",
            icon: Wallet,
          },
          {
            label: "Active Strategies",
            value: String(summary.activeStrategies),
            sub: "Deployed",
            icon: Zap,
          },
          {
            label: "Unrealized P/L",
            value: formatCurrency(summary.unrealizedPnl),
            sub: "Open positions",
            icon: summary.unrealizedPnl >= 0 ? TrendingUp : TrendingDown,
          },
        ].map((stat, i) => (
          <GlassCard key={stat.label} delay={i * 0.05}>
            <stat.icon className="mb-2 h-4 w-4 text-[#B0B0B0]" />
            <p className="text-xs text-[#B0B0B0]">{stat.label}</p>
            <p className="text-xl font-semibold">{stat.value}</p>
            <p className="text-xs text-[#B0B0B0]">{stat.sub}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="!p-4" delay={0.2}>
        <h2 className="mb-4 text-lg font-semibold">Performance</h2>
        <PerformanceChart data={performance} />
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard delay={0.25}>
          <h2 className="mb-4 text-lg font-semibold">Allocation</h2>
          <div className="space-y-3">
            {allocation.map((a) => (
              <div key={a.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{a.label}</span>
                  <span className="text-[#B0B0B0]">
                    {((a.value / summary.portfolioValue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(a.value / summary.portfolioValue) * 100}%`,
                      backgroundColor: a.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.3}>
          <h2 className="mb-4 text-lg font-semibold">Recent Trades</h2>
          {recentTrades.length === 0 ? (
            <p className="text-sm text-[#B0B0B0]">No trades yet. Start in Trade.</p>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{t.symbol}</span>
                    <span
                      className={`ml-2 text-xs ${
                        t.side === "BUY" ? "text-gain" : "text-loss"
                      }`}
                    >
                      {t.side}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <p>{t.quantity} @ {formatCurrency(t.price)}</p>
                    <p className="text-xs text-[#B0B0B0]">
                      {new Date(t.executedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
