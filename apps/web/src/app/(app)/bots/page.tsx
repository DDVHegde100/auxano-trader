"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/auxano/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bot, Play, Pause, RefreshCw, AlertTriangle } from "lucide-react";

type BotRow = {
  id: string;
  strategyName: string;
  strategySlug: string;
  primarySymbol: string;
  autopilotStatus: string;
  autopilotEnabled: boolean;
  intervalMinutes: number;
  lastSignal: string | null;
  lastSignalAt: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  allocated: number;
  utilizationPct: number;
  attributedRealizedPnl: number;
  unrealizedPnl: number;
  totalAutopilotTrades: number;
  lastError: string | null;
};

export default function BotsPage() {
  const [bots, setBots] = useState<BotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/autopilot/bots", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setBots(d.bots ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  async function patchBot(id: string, body: Record<string, unknown>) {
    setMsg("");
    const res = await fetch(`/api/autopilot/bots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error ?? "Update failed");
      return;
    }
    load();
  }

  async function runNow(id: string) {
    setMsg("Running tick…");
    const res = await fetch(`/api/autopilot/bots/${id}/run`, {
      method: "POST",
      credentials: "same-origin",
    });
    const d = await res.json();
    setMsg(d.result?.message ?? (res.ok ? "Done" : d.error));
    load();
  }

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="h-10 w-10 text-[var(--camel)]" />
          <div>
            <h1 className="text-3xl font-semibold">Bots</h1>
            <p className="text-[var(--foreground-muted)]">
              Paper autopilot — live quotes, block rules, scheduled runs every 5–15
              min
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </div>

      {msg && (
        <p className="rounded-xl border border-[var(--camel)]/30 bg-[var(--camel)]/10 px-4 py-2 text-sm">
          {msg}
        </p>
      )}

      {bots.length === 0 ? (
        <GlassCard className="text-center">
          <p className="text-[var(--foreground-muted)]">
            No deployed strategies yet. Deploy a DEFAULT preset or marketplace algo
            from{" "}
            <Link href="/marketplace" className="text-[var(--camel)]">
              Marketplace
            </Link>{" "}
            or{" "}
            <Link href="/builder" className="text-[var(--camel)]">
              Builder
            </Link>{" "}
            — autopilot starts automatically.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {bots.map((b) => (
            <GlassCard
              key={b.id}
              glow={b.autopilotStatus === "RUNNING"}
              className="flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/bots/${b.id}`}
                    className="text-lg font-semibold hover:text-[var(--camel)]"
                  >
                    {b.strategyName}
                  </Link>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {b.primarySymbol} · ${b.allocated.toLocaleString()} allocated ·
                    every {b.intervalMinutes}m
                  </p>
                </div>
                <StatusBadge status={b.autopilotStatus} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Signal</p>
                  <p className="font-semibold">{b.lastSignal ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Utilization</p>
                  <p className="font-semibold">{b.utilizationPct.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Bot trades</p>
                  <p className="font-semibold">{b.totalAutopilotTrades}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span
                  className={cn(
                    b.attributedRealizedPnl >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  Realized ${b.attributedRealizedPnl.toFixed(2)}
                </span>
                <span
                  className={cn(
                    b.unrealizedPnl >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  Open {b.unrealizedPnl >= 0 ? "+" : ""}$
                  {b.unrealizedPnl.toFixed(2)}
                </span>
              </div>

              {b.lastError && (
                <p className="mt-2 flex items-center gap-1 text-xs text-loss">
                  <AlertTriangle className="h-3 w-3" /> {b.lastError}
                </p>
              )}

              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                {b.lastRunAt
                  ? `Last run ${new Date(b.lastRunAt).toLocaleString()}`
                  : "Awaiting first run"}
                {b.nextRunAt &&
                  b.autopilotStatus === "RUNNING" &&
                  ` · next ${new Date(b.nextRunAt).toLocaleTimeString()}`}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/bots/${b.id}`}>
                  <Button size="sm">Logs & settings</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => runNow(b.id)}>
                  <Play className="mr-1 h-3 w-3" /> Run now
                </Button>
                {b.autopilotStatus === "RUNNING" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      patchBot(b.id, { autopilotStatus: "PAUSED" })
                    }
                  >
                    <Pause className="mr-1 h-3 w-3" /> Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      patchBot(b.id, { autopilotStatus: "RUNNING" })
                    }
                  >
                    Resume
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[var(--foreground-muted)]">
        Simulated paper trading only · Set CRON_SECRET on Vercel for scheduled ticks
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    RUNNING: "text-gain border-gain/40 bg-gain/10",
    PAUSED: "text-[var(--foreground-muted)] border-white/10",
    ERROR: "text-loss border-loss/40 bg-loss/10",
    IDLE: "text-[var(--camel)] border-[var(--camel)]/30",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium uppercase",
        colors[status] ?? colors.IDLE
      )}
    >
      {status}
    </span>
  );
}
