"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/auxano/glass-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Lock } from "lucide-react";

type ProfileResponse = {
  user: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    isProfilePublic: boolean;
    investingExperience: string | null;
  };
  portfolio: { totalValue: number; returnPct: number } | null;
  strategies: {
    id: string;
    name: string;
    slug: string;
    quantScore: number;
    visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE";
  }[];
  relation: "none" | "pending_out" | "pending_in" | "friends";
  isSelf: boolean;
  canViewPortfolio: boolean;
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setMsg(d.error);
        else setProfile(d);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [username]);

  async function sendRequest() {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error);
    else {
      setMsg("Friend request sent");
      load();
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!profile) {
    return (
      <GlassCard>
        <p>{msg || "User not found"}</p>
        <Link href="/friends" className="mt-4 inline-block text-[var(--camel)]">
          Find friends
        </Link>
      </GlassCard>
    );
  }

  const u = profile.user;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start gap-4">
        <UserAvatar
          name={u.name}
          username={u.username}
          avatarUrl={u.avatarUrl}
          size="lg"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{u.name ?? u.username}</h1>
          <p className="text-[var(--foreground-muted)]">@{u.username}</p>
          {u.bio && <p className="mt-3 text-sm leading-relaxed">{u.bio}</p>}
          {u.investingExperience && (
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Experience: {u.investingExperience.toLowerCase()}
            </p>
          )}
        </div>
        {!profile.isSelf && profile.relation === "none" && (
          <Button onClick={sendRequest}>Add friend</Button>
        )}
        {profile.relation === "pending_out" && (
          <span className="text-sm text-[var(--foreground-muted)]">Request pending</span>
        )}
        {profile.relation === "pending_in" && (
          <Link href="/friends" className="text-sm text-[var(--camel)]">
            Respond in Friends inbox
          </Link>
        )}
        {profile.relation === "friends" && (
          <span className="text-sm text-gain">Friends</span>
        )}
      </div>

      {msg && (
        <p className="text-sm text-[var(--camel)]">{msg}</p>
      )}

      {profile.canViewPortfolio && profile.portfolio ? (
        <GlassCard glow>
          <p className="text-sm text-[var(--foreground-muted)]">Paper portfolio</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatCurrency(profile.portfolio.totalValue)}
          </p>
          <p
            className={`mt-1 text-lg ${
              profile.portfolio.returnPct >= 0 ? "text-gain" : "text-loss"
            }`}
          >
            {formatPercent(profile.portfolio.returnPct)}
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="flex items-center gap-3 text-[var(--foreground-muted)]">
          <Lock className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Portfolio is private. Add as a friend to see performance.
          </p>
        </GlassCard>
      )}

      {profile.strategies.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Strategies</h2>
          <div className="space-y-2">
            {profile.strategies.map((s) => (
              <Link key={s.id} href={`/strategies/${s.slug}`}>
                <GlassCard className="!py-3 flex items-center justify-between">
                  <span>{s.name}</span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {s.visibility === "FRIENDS" ? "Friends" : "Public"}
                  </span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
