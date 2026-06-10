"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Swords, Trophy, Users, Globe, Share2, Copy, Zap } from "lucide-react";
import { portfolioShareUrl } from "@/lib/share/public-url";

type LeagueSummary = {
  id: string;
  title: string;
  description: string;
  rulesSummary: string;
  period: string;
  scope: string;
  status: string;
  endsAt: string;
  participantCount: number;
  viewerRank: number | null;
  viewerReturnPct: number | null;
  topThree: {
    rank: number;
    username: string | null;
    name: string | null;
    returnPct: number;
  }[];
};

type DuelSummary = {
  id: string;
  inviteCode: string;
  inviteUrl: string;
  status: string;
  title: string;
  durationDays: number;
  endsAt: string | null;
  creator: { username: string | null; name: string | null };
  opponent: { username: string | null; name: string | null } | null;
  creatorReturnPct: number | null;
  opponentReturnPct: number | null;
  isCreator: boolean;
};

export default function CompetePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [duels, setDuels] = useState<DuelSummary[]>([]);
  const [msg, setMsg] = useState("");
  const [opponent, setOpponent] = useState("");
  const [duration, setDuration] = useState("7");
  const [duelMsg, setDuelMsg] = useState("");
  const [lastInvite, setLastInvite] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/compete", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        setLeagues(d.leagues ?? []);
        setDuels(d.duels ?? []);
      })
      .finally(() => setLoading(false));
    fetch("/api/user/profile", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setUsername(d.user?.username ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDuel(target?: string) {
    setMsg("");
    const res = await fetch("/api/compete/duels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        opponentUsername: target || opponent || undefined,
        durationDays: Number(duration) || 7,
        message: duelMsg,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Could not create challenge");
      return;
    }
    setLastInvite(data.duel.inviteUrl);
    setOpponent("");
    setDuelMsg("");
    load();
    if (data.duel.status === "ACTIVE") {
      router.push(`/compete/duel/${data.duel.id}`);
    }
  }

  function copyInvite(url: string) {
    navigator.clipboard.writeText(url);
    setMsg("Invite link copied");
  }

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start gap-4">
        <Swords className="h-10 w-10 text-[var(--camel)]" />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">Compete</h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            Weekly & monthly leagues with rotating challenges · 1v1 friend duels
          </p>
        </div>
      </div>

      {msg && (
        <p className="rounded-xl border border-[var(--camel)]/30 bg-[var(--camel)]/10 px-4 py-2 text-sm text-[var(--camel)]">
          {msg}
        </p>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Trophy className="h-5 w-5" /> Active leagues
        </h2>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          A new challenge theme is picked automatically each week and month. Return %
          is measured from your join snapshot — fair paper-only competition.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {leagues.map((l) => (
            <GlassCard key={l.id} glow className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--camel)]">
                    {l.scope === "FRIENDS" ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    {l.period} · {l.scope}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{l.title}</h3>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {l.rulesSummary}
                  </p>
                </div>
                {l.viewerRank != null && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--camel)]">#{l.viewerRank}</p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        (l.viewerReturnPct ?? 0) >= 0 ? "text-gain" : "text-loss"
                      )}
                    >
                      {formatPercent(l.viewerReturnPct ?? 0)}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-[var(--foreground-muted)]">
                {l.description}
              </p>
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                Ends {new Date(l.endsAt).toLocaleDateString()} · {l.participantCount}{" "}
                traders
              </p>
              {l.topThree.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
                  {l.topThree.map((t) => (
                    <div key={t.rank} className="flex justify-between text-sm">
                      <span>
                        #{t.rank} {t.name ?? t.username}
                      </span>
                      <span className={t.returnPct >= 0 ? "text-gain" : "text-loss"}>
                        {formatPercent(t.returnPct)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/compete/league/${l.id}`}>
                  <Button size="sm">View standings</Button>
                </Link>
                {username && l.viewerRank != null && l.viewerRank <= 10 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      copyInvite(
                        `${portfolioShareUrl(username, "week")}?league=${encodeURIComponent(l.id)}&rank=${l.viewerRank}`
                      )
                    }
                  >
                    <Share2 className="mr-1 h-3 w-3" /> Share rank
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Zap className="h-5 w-5" /> Head-to-head challenge
        </h2>
        <GlassCard>
          <p className="text-sm text-[var(--foreground-muted)]">
            Challenge a friend directly or create an open invite link. Both portfolios
            are snapshotted at start — highest return % when the clock runs out wins.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[var(--foreground-muted)]">
                Friend username (optional)
              </label>
              <Input
                className="mt-1"
                placeholder="@username"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--foreground-muted)]">Duration (days)</label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <Input
            className="mt-3"
            placeholder="Taunt message (optional)"
            value={duelMsg}
            onChange={(e) => setDuelMsg(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => createDuel()}>Create challenge</Button>
            <Button variant="secondary" onClick={() => createDuel(opponent)}>
              Challenge friend
            </Button>
          </div>
          {lastInvite && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-xs text-[var(--foreground-muted)]">Invite link</p>
              <p className="mt-1 break-all text-sm">{lastInvite}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => copyInvite(lastInvite)}
              >
                <Copy className="mr-1 h-3 w-3" /> Copy link
              </Button>
            </div>
          )}
        </GlassCard>
      </section>

      {duels.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your active duels</h2>
          <div className="space-y-3">
            {duels.map((d) => (
              <Link key={d.id} href={`/compete/duel/${d.id}`}>
                <GlassCard className="flex items-center justify-between !py-3 hover:bg-white/[0.04]">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {d.creator.name ?? d.creator.username}
                      {d.opponent
                        ? ` vs ${d.opponent.name ?? d.opponent.username}`
                        : " · awaiting opponent"}
                      {" · "}
                      {d.status}
                    </p>
                  </div>
                  {d.status === "ACTIVE" &&
                    d.creatorReturnPct != null &&
                    d.opponentReturnPct != null && (
                      <div className="text-right text-sm">
                        <span
                          className={
                            (d.isCreator
                              ? d.creatorReturnPct
                              : d.opponentReturnPct) >= 0
                              ? "text-gain"
                              : "text-loss"
                          }
                        >
                          {formatPercent(
                            d.isCreator ? d.creatorReturnPct : d.opponentReturnPct
                          )}
                        </span>
                      </div>
                    )}
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-[var(--foreground-muted)]">
        Paper trading only · Not financial advice
      </p>
    </div>
  );
}
