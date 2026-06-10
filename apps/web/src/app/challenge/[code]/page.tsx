"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { GlassCard } from "@/components/auxano/glass-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";

const DEV = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";

export default function ChallengeInvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [info, setInfo] = useState<{
    title: string;
    status: string;
    durationDays: number;
    message: string | null;
    creator: { username: string | null; name: string | null; avatarUrl: string | null };
    opponent: { username: string | null; name: string | null } | null;
    inviteUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/compete/duels/invite/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setMsg(d.error);
        else setInfo(d);
      })
      .finally(() => setLoading(false));
  }, [code]);

  async function accept() {
    if (!code) return;
    setAccepting(true);
    setMsg("");
    const res = await fetch(`/api/compete/duels/invite/${code}`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not accept");
      return;
    }
    router.push(`/compete/duel/${data.duel.id}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(188,138,95,0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-md space-y-6">
        <header className="text-center">
          <Link href="/" className="text-3xl font-semibold text-[var(--camel)]">
            Auxano
          </Link>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Paper trading duel invite
          </p>
        </header>

        {!info ? (
          <GlassCard>
            <p className="text-center text-[var(--foreground-muted)]">
              {msg || "Challenge not found"}
            </p>
          </GlassCard>
        ) : (
          <>
            <GlassCard className="text-center">
              <Swords className="mx-auto h-10 w-10 text-[var(--camel)]" />
              <h1 className="mt-3 text-xl font-semibold">{info.title}</h1>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {info.durationDays}-day return % duel · {info.status}
              </p>
              {info.message && (
                <p className="mt-4 text-sm italic">&ldquo;{info.message}&rdquo;</p>
              )}
            </GlassCard>

            <GlassCard className="flex items-center gap-3">
              <UserAvatar
                name={info.creator.name ?? info.creator.username ?? "?"}
                avatarUrl={info.creator.avatarUrl}
              />
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">Challenged by</p>
                <p className="font-medium">
                  {info.creator.name ?? info.creator.username ?? "Trader"}
                </p>
              </div>
            </GlassCard>

            {info.status === "PENDING" && (
              <>
                {DEV || isSignedIn ? (
                  <Button className="w-full" onClick={accept} disabled={accepting}>
                    {accepting ? "Starting duel…" : "Accept challenge"}
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button className="w-full">Sign in to accept</Button>
                  </SignInButton>
                )}
                <p className="text-center text-xs text-[var(--foreground-muted)]">
                  Snapshots taken at accept — paper portfolios only.
                </p>
              </>
            )}

            {info.status === "ACTIVE" && info.opponent && (
              <p className="text-center text-sm text-[var(--foreground-muted)]">
                This duel is already in progress.
              </p>
            )}

            {info.status !== "PENDING" && info.status !== "ACTIVE" && (
              <p className="text-center text-sm text-[var(--foreground-muted)]">
                This challenge is closed ({info.status}).
              </p>
            )}
          </>
        )}

        {msg && <p className="text-center text-sm text-[var(--camel)]">{msg}</p>}

        <p className="text-center text-xs text-[var(--foreground-muted)]">
          Simulated paper trading only · Not financial advice
        </p>
      </div>
    </div>
  );
}
