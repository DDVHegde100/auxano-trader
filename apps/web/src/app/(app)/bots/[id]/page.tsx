"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, cn } from "@/lib/utils";
import { ArrowLeft, Bot, Play } from "lucide-react";

type RunLog = {
  id: string;
  status: string;
  signal: string;
  symbol: string;
  message: string | null;
  createdAt: string;
  tradeId: string | null;
  indicators?: Record<string, number>;
};

type BotDetail = {
  id: string;
  strategyName: string;
  strategySlug: string;
  primarySymbol: string;
  autopilotStatus: string;
  intervalMinutes: number;
  allocated: number;
  lastSignal: string | null;
  attributedRealizedPnl: number;
  unrealizedPnl: number;
  utilizationPct: number;
  runs: RunLog[];
};

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<BotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setIntervalMin] = useState("10");
  const [allocated, setAllocated] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/autopilot/bots/${id}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.bot) {
          setBot(d.bot);
          setIntervalMin(String(d.bot.intervalMinutes));
          setAllocated(String(d.bot.allocated));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const res = await fetch(`/api/autopilot/bots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        intervalMinutes: Number(interval),
        allocated: Number(allocated),
      }),
    });
    const d = await res.json();
    setMsg(res.ok ? "Saved" : d.error);
    load();
  }

  async function runNow() {
    const res = await fetch(`/api/autopilot/bots/${id}/run`, {
      method: "POST",
      credentials: "same-origin",
    });
    const d = await res.json();
    setMsg(d.result?.message ?? d.error);
    load();
  }

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!bot) return <p>Bot not found</p>;

  return (
    <div className="space-y-6">
      <Link
        href="/bots"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> All bots
      </Link>

      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-[var(--camel)]" />
        <div>
          <h1 className="text-2xl font-semibold">{bot.strategyName}</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {bot.primarySymbol} · {bot.autopilotStatus} · last {bot.lastSignal ?? "—"}
          </p>
        </div>
      </div>

      <GlassCard>
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Attributed realized"
            value={`$${bot.attributedRealizedPnl.toFixed(2)}`}
            positive={bot.attributedRealizedPnl >= 0}
          />
          <Metric
            label="Unrealized"
            value={`$${bot.unrealizedPnl.toFixed(2)}`}
            positive={bot.unrealizedPnl >= 0}
          />
          <Metric label="Allocation used" value={`${bot.utilizationPct.toFixed(0)}%`} />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold">Settings</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[var(--foreground-muted)]">
              Interval (minutes, 5–60)
            </label>
            <Input
              className="mt-1"
              type="number"
              min={5}
              max={60}
              value={interval}
              onChange={(e) => setIntervalMin(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--foreground-muted)]">
              Paper allocation ($)
            </label>
            <Input
              className="mt-1"
              type="number"
              value={allocated}
              onChange={(e) => setAllocated(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={save}>
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={runNow}>
            <Play className="mr-1 h-3 w-3" /> Run now
          </Button>
        </div>
        {msg && <p className="mt-2 text-sm text-[var(--camel)]">{msg}</p>}
      </GlassCard>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Run log</h2>
        <div className="space-y-2">
          {bot.runs.length === 0 && (
            <p className="text-sm text-[var(--foreground-muted)]">No runs yet</p>
          )}
          {bot.runs.map((r) => (
            <GlassCard key={r.id} className="!py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{r.signal}</span>
                  <span className="mx-2 text-[var(--foreground-muted)]">·</span>
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {r.status} · {r.symbol}
                  </span>
                </div>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              {r.message && (
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {r.message}
                </p>
              )}
              {r.indicators && (
                <p className="mt-1 font-mono text-xs text-[var(--foreground-muted)]">
                  RSI {r.indicators.rsi} · MA20 {r.indicators.ma50} · MA50{" "}
                  {r.indicators.ma200}
                  {r.indicators.profitPct != null &&
                    ` · P&L% ${r.indicators.profitPct}`}
                </p>
              )}
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--foreground-muted)]">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold",
          positive === true && "text-gain",
          positive === false && "text-loss"
        )}
      >
        {value}
      </p>
    </div>
  );
}
