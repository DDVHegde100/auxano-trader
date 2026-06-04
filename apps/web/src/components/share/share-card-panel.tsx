"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/auxano/glass-card";
import { PortfolioShareCardVisual, StrategyShareCardVisual } from "@/components/share/share-card-visual";
import { ShareCardActions } from "@/components/share/share-card-actions";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  PortfolioShareCard,
  StrategyShareCard,
  SharePeriod,
} from "@/lib/share/share-card-data";
import { cn } from "@/lib/utils";

export function PortfolioSharePanel({
  username,
  className,
}: {
  username: string;
  className?: string;
}) {
  const [period, setPeriod] = useState<SharePeriod>("week");
  const [data, setData] = useState<PortfolioShareCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/share/${encodeURIComponent(username)}?period=${period}`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setError(null);
          setData(d);
        }
      })
      .finally(() => setLoading(false));
  }, [username, period]);

  if (loading) return <Skeleton className={cn("h-80 w-full", className)} />;
  if (error || !data) {
    return (
      <GlassCard className={className}>
        <p className="text-sm text-[var(--foreground-muted)]">
          {error ?? "Could not load share card"}
        </p>
      </GlassCard>
    );
  }

  if (!data.visible) {
    return (
      <GlassCard className={className}>
        <p className="text-sm text-[var(--foreground-muted)]">
          Enable a <strong>public profile</strong> in settings to share performance cards
          and social previews.
        </p>
      </GlassCard>
    );
  }

  const shareText = `${data.displayName}'s ${data.periodLabel} paper return: ${data.returnPct >= 0 ? "+" : ""}${data.returnPct.toFixed(2)}% vs SPY on Auxano`;

  return (
    <div className={cn("space-y-4", className)} id="auxano-share-card">
      <div className="flex gap-2">
        {(["week", "30d"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition-colors",
              period === p
                ? "border-[var(--camel)]/50 bg-[var(--camel)]/15 text-[var(--camel)]"
                : "border-white/[0.08] text-[var(--foreground-muted)] hover:bg-white/[0.04]"
            )}
          >
            {p === "week" ? "7 days" : "30 days"}
          </button>
        ))}
      </div>
      <PortfolioShareCardVisual data={data} />
      <ShareCardActions
        publicUrl={data.publicUrl}
        imageUrl={data.imageUrl}
        title={`${data.username}-${period}`}
        text={shareText}
      />
    </div>
  );
}

export function StrategySharePanel({ slug, className }: { slug: string; className?: string }) {
  const [data, setData] = useState<StrategyShareCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/strategy/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className={cn("h-72 w-full", className)} />;
  if (!data?.visible) return null;

  const shareText = `${data.name} on Auxano — Quant ${data.quantScore}, ${data.historicalReturn.toFixed(1)}% backtest (paper)`;

  return (
    <div className={cn("space-y-4", className)}>
      <StrategyShareCardVisual data={data} />
      <ShareCardActions
        publicUrl={data.publicUrl}
        imageUrl={data.imageUrl}
        title={data.slug}
        text={shareText}
      />
    </div>
  );
}
