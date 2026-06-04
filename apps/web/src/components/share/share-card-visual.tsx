"use client";

import { seriesToSvgPath } from "@/lib/share/chart-path";
import type { PortfolioShareCard, StrategyShareCard } from "@/lib/share/share-card-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

function MiniDualChart({
  equityCurve,
  spyCurve,
  className,
}: {
  equityCurve: { value: number }[];
  spyCurve: { value: number }[];
  className?: string;
}) {
  const w = 400;
  const h = 120;
  const portPath = seriesToSvgPath(
    equityCurve.map((p) => p.value),
    w,
    h
  );
  const spyPath = seriesToSvgPath(
    spyCurve.map((p) => p.value),
    w,
    h
  );

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("w-full h-32", className)}
      preserveAspectRatio="none"
    >
      <path
        d={spyPath}
        fill="none"
        stroke="rgba(199,199,199,0.45)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={portPath}
        fill="none"
        stroke="var(--camel, #bc8a5f)"
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PortfolioShareCardVisual({
  data,
  compact,
}: {
  data: PortfolioShareCard;
  compact?: boolean;
}) {
  const positive = data.returnPct >= 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--camel)]/25",
        "bg-gradient-to-br from-[#1a1209] via-[#2a1a0e] to-[#14100c]",
        compact ? "p-5" : "p-8"
      )}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #bc8a5f 0%, transparent 70%)" }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--foreground-muted)]">
            Auxano · Paper
          </p>
          <h3 className={cn("font-semibold", compact ? "text-xl" : "text-2xl")}>
            @{data.username}
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">{data.periodLabel} performance</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--camel)]/40 bg-[var(--camel)]/15 text-lg font-bold text-[var(--camel)]">
          A
        </div>
      </div>

      <div className={cn("relative mt-6 grid gap-4", compact ? "grid-cols-2" : "grid-cols-3")}>
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">Return</p>
          <p
            className={cn(
              "font-semibold tabular-nums",
              compact ? "text-2xl" : "text-4xl",
              positive ? "text-gain" : "text-loss"
            )}
          >
            {formatPercent(data.returnPct)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">vs SPY</p>
          <p className={cn("font-semibold tabular-nums", compact ? "text-xl" : "text-2xl")}>
            {formatPercent(data.alphaVsSpy)}
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            SPY {formatPercent(data.spyReturnPct)}
          </p>
        </div>
        {!compact && (
          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Portfolio</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(data.portfolioValue)}
            </p>
          </div>
        )}
      </div>

      {data.topStrategy && (
        <div className="relative mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-[var(--foreground-muted)]">Top strategy</p>
          <p className="font-medium">{data.topStrategy.name}</p>
          <p className="text-sm text-[var(--camel)]">
            Quant {data.topStrategy.quantScore} ·{" "}
            {formatPercent(data.topStrategy.historicalReturn)} backtest
          </p>
        </div>
      )}

      <div className="relative mt-4">
        <div className="mb-2 flex gap-4 text-xs text-[var(--foreground-muted)]">
          <span className="text-[var(--camel)]">Portfolio</span>
          <span>SPY</span>
        </div>
        <MiniDualChart equityCurve={data.equityCurve} spyCurve={data.spyCurve} />
      </div>

      <p className="relative mt-4 text-[10px] leading-snug text-[var(--foreground-muted)]/70">
        Simulated paper trading only. Not financial advice.
      </p>
    </div>
  );
}

export function StrategyShareCardVisual({
  data,
  compact,
}: {
  data: StrategyShareCard;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--camel)]/25",
        "bg-gradient-to-br from-[#111] via-[#2a1a0e] to-[#111]",
        compact ? "p-5" : "p-8"
      )}
    >
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--foreground-muted)]">
            Strategy card
          </p>
          <h3 className={cn("font-semibold", compact ? "text-lg" : "text-2xl")}>{data.name}</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            {data.category} · @{data.creator.username}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-[var(--camel)] font-bold text-[var(--camel)]",
            compact ? "h-14 w-14 text-xl" : "h-20 w-20 text-3xl"
          )}
        >
          {data.quantScore}
        </div>
      </div>

      <div className="relative mt-6 flex gap-8">
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">Backtest return</p>
          <p className={cn("font-semibold text-gain", compact ? "text-2xl" : "text-3xl")}>
            {formatPercent(data.historicalReturn)}
          </p>
        </div>
        {data.maxDrawdown != null && (
          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Max drawdown</p>
            <p className="text-xl font-medium">{formatPercent(-Math.abs(data.maxDrawdown))}</p>
          </div>
        )}
      </div>

      <div className="relative mt-4">
        <MiniDualChart equityCurve={data.equityCurve} spyCurve={data.spyCurve} />
      </div>

      <p className="relative mt-3 text-[10px] text-[var(--foreground-muted)]/70">
        Simulated backtest · paper trading only
      </p>
    </div>
  );
}
