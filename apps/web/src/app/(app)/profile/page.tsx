"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/auxano/glass-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Settings, Users, Share2 } from "lucide-react";
import { PortfolioSharePanel } from "@/components/share/share-card-panel";
import { MyStrategiesPanel } from "@/components/strategies/my-strategies-panel";

type ProfileData = {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    isProfilePublic: boolean;
    investingExperience: string | null;
    riskTolerance: string | null;
    financialGoal: string | null;
  };
  portfolio: { totalValue: number; returnPct: number; cashBalance: number } | null;
  strategies: {
    id: string;
    name: string;
    slug: string;
    quantScore: number;
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  }[];
  isSelf: boolean;
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/user/profile", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setMsg(d.error);
          return;
        }
        setProfile(d);
        setBio(d.user.bio ?? "");
        setIsPublic(d.user.isProfilePublic);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ bio, isProfilePublic: isPublic }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(json.error ?? "Save failed");
      return;
    }
    setMsg("Profile updated");
    load();
  }

  if (!profile && !msg) return <Skeleton className="h-96 w-full" />;

  if (!profile?.user.username) {
    return (
      <GlassCard>
        <p className="text-[var(--foreground-muted)]">
          {msg || "Add a username in Clerk to enable your public profile."}
        </p>
      </GlassCard>
    );
  }

  const u = profile.user;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-start gap-4">
        <UserAvatar
          name={u.name}
          username={u.username}
          avatarUrl={u.avatarUrl}
          size="lg"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{u.name ?? u.username}</h1>
          <p className="text-[var(--foreground-muted)]">@{u.username}</p>
          <Link
            href="/friends"
            className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--camel)] hover:underline"
          >
            <Users className="h-4 w-4" /> Friends & requests
          </Link>
        </div>
      </div>

      {profile.portfolio && (
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
            {formatPercent(profile.portfolio.returnPct)} all-time
          </p>
        </GlassCard>
      )}

      {u.username && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Share2 className="h-5 w-5 text-[var(--camel)]" />
            Share performance
          </h2>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Download a branded card or share your public week link — great for iMessage,
            X, and LinkedIn previews.
          </p>
          <PortfolioSharePanel username={u.username} />
        </section>
      )}

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Settings className="h-5 w-5" /> Profile settings
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Username is managed in Clerk at sign-up and cannot be changed here.
        </p>
        <label className="mt-4 block text-sm text-[var(--foreground-muted)]">Bio</label>
        <Input
          className="mt-1"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell others about your investing style"
        />
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-white/20"
          />
          <span className="text-sm">
            Public profile (anyone can see portfolio on leaderboard)
          </span>
        </label>
        {msg && <p className="mt-3 text-sm text-[var(--camel)]">{msg}</p>}
        <Button className="mt-4" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </GlassCard>

      <section>
        <h2 className="mb-1 text-lg font-semibold">My strategies</h2>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          Public strategies appear in the community marketplace. Friends-only
          strategies show on your profile for mutual friends. Private strategies
          are only visible to you — you can still trade and run them on Bots.
        </p>
        <MyStrategiesPanel strategies={profile.strategies} onChanged={load} />
      </section>
    </div>
  );
}
