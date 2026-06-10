"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { portfolioShareUrl } from "@/lib/share/public-url";

type Standing = {
  userId: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  returnPct: number;
  rank: number;
  isSelf?: boolean;
};

export default function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<Record<string, string> | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [viewer, setViewer] = useState<Standing | null>(null);
  const [count, setCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/compete/leagues/${id}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setLeague(d.league);
        setStandings(d.standings ?? []);
        setViewer(d.viewerEntry ?? null);
        setCount(d.participantCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/user/profile", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setUsername(d.user?.username ?? null))
      .catch(() => {});
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!league) {
    return (
      <p className="text-[var(--foreground-muted)]">League not found or ended.</p>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/compete"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Compete
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--camel)]">
            {league.period} · {league.scope}
          </p>
          <h1 className="text-2xl font-semibold">{league.title}</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {league.rulesSummary}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Ends {new Date(league.endsAt).toLocaleString()} · {count} participants
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </div>

      {viewer && (
        <GlassCard glow className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-[var(--camel)]" />
            <div>
              <p className="text-sm text-[var(--foreground-muted)]">Your standing</p>
              <p className="text-2xl font-bold">#{viewer.rank}</p>
            </div>
          </div>
          <p
            className={cn(
              "text-xl font-semibold",
              viewer.returnPct >= 0 ? "text-gain" : "text-loss"
            )}
          >
            {formatPercent(viewer.returnPct)}
          </p>
          {username && viewer.rank <= 10 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${portfolioShareUrl(username, "week")}?league=${encodeURIComponent(id)}&rank=${viewer.rank}`
                )
              }
            >
              Share card
            </Button>
          )}
        </GlassCard>
      )}

      <div className="space-y-2">
        {standings.map((s) => (
          <GlassCard
            key={s.userId}
            className={cn(
              "flex items-center gap-3 !py-3",
              s.isSelf && "ring-1 ring-[var(--camel)]/40"
            )}
          >
            <span className="w-8 text-center font-bold text-[var(--foreground-muted)]">
              {s.rank}
            </span>
            <UserAvatar
              name={s.name ?? s.username ?? "?"}
              avatarUrl={s.avatarUrl}
              size="sm"
            />
            <div className="flex-1">
              {s.username ? (
                <Link
                  href={`/profile/${s.username}`}
                  className="font-medium hover:text-[var(--camel)]"
                >
                  {s.name ?? s.username}
                </Link>
              ) : (
                <span className="font-medium">{s.name ?? "Trader"}</span>
              )}
              {s.isSelf && (
                <span className="ml-2 text-xs text-[var(--camel)]">You</span>
              )}
            </div>
            <span
              className={cn(
                "font-semibold tabular-nums",
                s.returnPct >= 0 ? "text-gain" : "text-loss"
              )}
            >
              {formatPercent(s.returnPct)}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
