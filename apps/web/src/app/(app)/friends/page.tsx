"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/auxano/glass-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Users, Inbox, Send } from "lucide-react";

type PublicUser = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

type SocialData = {
  incoming: { id: string; createdAt: string; from: PublicUser }[];
  outgoing: { id: string; createdAt: string; to: PublicUser }[];
  friends: { friendshipId: string; since: string; user: PublicUser }[];
};

type SearchUser = PublicUser & {
  relation: "none" | "pending_out" | "pending_in" | "friends" | "rejected";
};

export default function FriendsPage() {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [addUsername, setAddUsername] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends", { credentials: "same-origin" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: "same-origin",
      })
        .then((r) => r.json())
        .then((d) => setSearchResults(d.users ?? []));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function sendRequest(username: string) {
    setBusy(username);
    setMsg("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setMsg(json.error ?? "Could not send request");
      return;
    }
    setMsg(`Request sent to @${username.replace(/^@/, "")}`);
    setAddUsername("");
    load();
    if (query) {
      fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: "same-origin",
      })
        .then((r) => r.json())
        .then((d) => setSearchResults(d.users ?? []));
    }
  }

  async function respond(id: string, action: "accept" | "reject") {
    setBusy(id);
    const res = await fetch(`/api/friends/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json();
      setMsg(json.error ?? "Failed");
      return;
    }
    setMsg(action === "accept" ? "Friend added" : "Request declined");
    load();
  }

  async function removeFriend(userId: string) {
    setBusy(userId);
    await fetch(`/api/friends?userId=${userId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setBusy(null);
    load();
  }

  if (loading && !data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-[var(--foreground-muted)]" />
        <div>
          <h1 className="text-3xl font-semibold">Friends</h1>
          <p className="text-[var(--foreground-muted)]">
            Send requests, accept invites, and compete on the leaderboard
          </p>
        </div>
      </div>

      {msg && (
        <p className="rounded-xl border border-[var(--camel)]/30 bg-[var(--camel)]/10 px-4 py-2 text-sm text-[var(--camel)]">
          {msg}
        </p>
      )}

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <UserPlus className="h-5 w-5" /> Add by username
        </h2>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="@username"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
          />
          <Button
            disabled={!addUsername.trim() || busy !== null}
            onClick={() => sendRequest(addUsername)}
          >
            Add
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-semibold">Search people</h2>
        <Input
          className="mt-4"
          placeholder="Search username or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-4 space-y-3">
          {searchResults.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3"
            >
              <UserAvatar name={u.name} username={u.username} avatarUrl={u.avatarUrl} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${u.username}`}
                  className="font-medium hover:text-[var(--camel)]"
                >
                  {u.name ?? u.username}
                </Link>
                <p className="text-xs text-[var(--foreground-muted)]">@{u.username}</p>
              </div>
              {u.relation === "friends" && (
                <span className="text-xs text-gain">Friends</span>
              )}
              {u.relation === "pending_out" && (
                <span className="text-xs text-[var(--foreground-muted)]">Pending</span>
              )}
              {u.relation === "pending_in" && (
                <Button size="sm" onClick={() => {}} disabled>
                  Respond in inbox
                </Button>
              )}
              {u.relation === "none" && u.username && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy === u.username}
                  onClick={() => sendRequest(u.username!)}
                >
                  Add
                </Button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Inbox className="h-5 w-5" /> Incoming requests
          {(data?.incoming.length ?? 0) > 0 && (
            <span className="rounded-full bg-[var(--camel)] px-2 py-0.5 text-xs text-black">
              {data?.incoming.length}
            </span>
          )}
        </h2>
        <div className="space-y-3">
          {(data?.incoming ?? []).map((r) => (
            <GlassCard key={r.id} className="flex flex-wrap items-center gap-3 !py-3">
              <UserAvatar
                name={r.from.name}
                username={r.from.username}
                avatarUrl={r.from.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.from.name ?? r.from.username}</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  @{r.from.username}
                </p>
              </div>
              <Button
                size="sm"
                disabled={busy === r.id}
                onClick={() => respond(r.id, "accept")}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === r.id}
                onClick={() => respond(r.id, "reject")}
              >
                Decline
              </Button>
            </GlassCard>
          ))}
          {!data?.incoming.length && (
            <p className="text-sm text-[var(--foreground-muted)]">No pending requests</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Send className="h-5 w-5" /> Sent requests
        </h2>
        <div className="space-y-3">
          {(data?.outgoing ?? []).map((r) => (
            <GlassCard key={r.id} className="flex items-center gap-3 !py-3">
              <UserAvatar
                name={r.to.name}
                username={r.to.username}
                avatarUrl={r.to.avatarUrl}
              />
              <div className="flex-1">
                <p className="font-medium">{r.to.name ?? r.to.username}</p>
                <p className="text-xs text-[var(--foreground-muted)]">Awaiting response</p>
              </div>
            </GlassCard>
          ))}
          {!data?.outgoing.length && (
            <p className="text-sm text-[var(--foreground-muted)]">No outgoing requests</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your friends</h2>
        <div className="space-y-3">
          {(data?.friends ?? []).map((f) => (
            <GlassCard key={f.friendshipId} className="flex items-center gap-3 !py-3">
              <UserAvatar
                name={f.user.name}
                username={f.user.username}
                avatarUrl={f.user.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${f.user.username}`}
                  className="font-medium hover:text-[var(--camel)]"
                >
                  {f.user.name ?? f.user.username}
                </Link>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Friends since {new Date(f.since).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === f.user.id}
                onClick={() => removeFriend(f.user.id)}
              >
                Remove
              </Button>
            </GlassCard>
          ))}
          {!data?.friends.length && (
            <p className="text-sm text-[var(--foreground-muted)]">
              Add friends to see private portfolios and compete together.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
