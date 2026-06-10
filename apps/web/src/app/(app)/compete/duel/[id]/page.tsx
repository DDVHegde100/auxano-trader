"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, cn } from "@/lib/utils";
import { ArrowLeft, Copy, Swords } from "lucide-react";

type Duel = {
  id: string;
  inviteCode: string;
  inviteUrl: string;
  status: string;
  title: string;
  durationDays: number;
  endsAt: string | null;
  message: string | null;
  winnerId: string | null;
  creator: { username: string | null; name: string | null; avatarUrl: string | null };
  opponent: { username: string | null; name: string | null; avatarUrl: string | null } | null;
  creatorReturnPct: number | null;
  opponentReturnPct: number | null;
  isCreator: boolean;
};

export default function DuelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [duel, setDuel] = useState<Duel | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/compete/duels/${id}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setDuel(d.duel ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  async function decline() {
    const res = await fetch(`/api/compete/duels/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) {
      setMsg("Challenge declined");
      load();
    }
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!duel) {
    return <p className="text-[var(--foreground-muted)]">Duel not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/compete"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Compete
      </Link>

      <div className="flex items-center gap-3">
        <Swords className="h-8 w-8 text-[var(--camel)]" />
        <div>
          <h1 className="text-2xl font-semibold">{duel.title}</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {duel.durationDays} days · {duel.status}
            {duel.endsAt && ` · ends ${new Date(duel.endsAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {duel.message && (
        <GlassCard>
          <p className="text-sm italic text-[var(--foreground-muted)]">
            &ldquo;{duel.message}&rdquo;
          </p>
        </GlassCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <PlayerCard
          label="Creator"
          user={duel.creator}
          returnPct={duel.creatorReturnPct}
          highlight={duel.isCreator}
        />
        <PlayerCard
          label={duel.opponent ? "Opponent" : "Waiting…"}
          user={duel.opponent}
          returnPct={duel.opponentReturnPct}
          highlight={!duel.isCreator && !!duel.opponent}
        />
      </div>

      {duel.status === "PENDING" && duel.isCreator && (
        <GlassCard>
          <p className="text-sm text-[var(--foreground-muted)]">Share invite link</p>
          <p className="mt-2 break-all text-sm">{duel.inviteUrl}</p>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(duel.inviteUrl);
              setMsg("Copied");
            }}
          >
            <Copy className="mr-1 h-3 w-3" /> Copy invite
          </Button>
        </GlassCard>
      )}

      {duel.status === "COMPLETED" && (
        <GlassCard glow>
          <p className="text-center text-lg font-semibold">
            {duel.winnerId ? "Winner decided" : "Tie — no winner"}
          </p>
        </GlassCard>
      )}

      {msg && <p className="text-sm text-[var(--camel)]">{msg}</p>}

      {duel.status === "PENDING" && !duel.isCreator && (
        <Button variant="secondary" onClick={decline}>
          Decline
        </Button>
      )}
    </div>
  );
}

function PlayerCard({
  label,
  user,
  returnPct,
  highlight,
}: {
  label: string;
  user: { username: string | null; name: string | null; avatarUrl: string | null } | null;
  returnPct: number | null;
  highlight: boolean;
}) {
  if (!user) {
    return (
      <GlassCard className="text-center text-[var(--foreground-muted)]">
        {label}
      </GlassCard>
    );
  }
  return (
    <GlassCard className={cn(highlight && "ring-1 ring-[var(--camel)]/50")}>
      <p className="text-xs text-[var(--foreground-muted)]">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <UserAvatar name={user.name ?? user.username ?? "?"} avatarUrl={user.avatarUrl} />
        <div>
          <p className="font-medium">{user.name ?? user.username}</p>
          {user.username && (
            <Link href={`/profile/${user.username}`} className="text-xs text-[var(--camel)]">
              @{user.username}
            </Link>
          )}
        </div>
      </div>
      {returnPct != null && (
        <p
          className={cn(
            "mt-3 text-2xl font-bold tabular-nums",
            returnPct >= 0 ? "text-gain" : "text-loss"
          )}
        >
          {formatPercent(returnPct)}
        </p>
      )}
    </GlassCard>
  );
}
