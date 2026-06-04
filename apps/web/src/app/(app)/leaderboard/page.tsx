"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/auxano/glass-card";
import { QuantScoreBadge } from "@/components/auxano/quant-score-badge";
import { UserAvatar } from "@/components/social/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { RefreshCw, Trophy } from "lucide-react";
import type { LeaderboardPayload } from "@/lib/types/leaderboard";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const url = refresh ? "/api/leaderboard?refresh=1" : "/api/leaderboard";
      const res = await fetch(url, { credentials: "same-origin" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const onTrade = () => load(true);
    window.addEventListener("auxano:trade-complete", onTrade);
    return () => window.removeEventListener("auxano:trade-complete", onTrade);
  }, [load]);

  if (loading && !data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-[#C7C7C7]" />
          <div>
            <h1 className="text-3xl font-semibold">Leaderboards</h1>
            <p className="text-[var(--foreground-muted)]">
              Live paper-trader rankings · top 10
            </p>
            {data?.refreshedAt && (
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Updated {new Date(data.refreshedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={refreshing}
          onClick={() => load(true)}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh quotes
        </Button>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Paper Traders</h2>
        <div className="space-y-3">
          {(data?.topTraders ?? []).map((t) => (
            <Link
              key={t.user.id}
              href={t.user.username ? `/profile/${t.user.username}` : "#"}
            >
              <GlassCard className="flex items-center gap-4 !py-3 transition-colors hover:bg-white/[0.04]">
                <span className="w-8 text-2xl font-bold text-[var(--foreground-muted)]/40">
                  {t.rank}
                </span>
                <UserAvatar
                  name={t.user.name}
                  username={t.user.username}
                  avatarUrl={t.user.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {t.user.name ?? t.user.username}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    @{t.user.username} · {formatCurrency(t.portfolioValue)}
                  </p>
                </div>
                <span className={t.returnPct >= 0 ? "text-gain" : "text-loss"}>
                  {formatPercent(t.returnPct)}
                </span>
              </GlassCard>
            </Link>
          ))}
          {!data?.topTraders?.length && (
            <p className="text-sm text-[var(--foreground-muted)]">
              No public traders yet. Complete onboarding and trade to appear here.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Strategies</h2>
        <div className="space-y-3">
          {(data?.topStrategies ?? []).map((s, i) => (
            <Link key={s.id} href={`/strategies/${s.slug}`}>
              <GlassCard className="flex items-center gap-4 !py-3">
                <span className="w-8 text-2xl font-bold text-[var(--foreground-muted)]/40">
                  {i + 1}
                </span>
                <QuantScoreBadge score={s.quantScore} size="sm" />
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="text-sm text-gain">
                  {formatPercent(s.historicalReturn)}
                </span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Creators</h2>
        <div className="space-y-3">
          {(data?.topCreators ?? []).map((c) => (
            <Link
              key={c.id}
              href={c.username ? `/profile/${c.username}` : "#"}
            >
              <GlassCard className="flex items-center gap-4 !py-3">
                <span className="w-8 text-2xl font-bold text-[var(--foreground-muted)]/40">
                  {c.rank}
                </span>
                <UserAvatar
                  name={c.name}
                  username={c.username}
                  avatarUrl={c.avatarUrl}
                />
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    @{c.username} · {c.strategyCount} strategies · score {c.score}
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
