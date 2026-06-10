"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Globe, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type MyStrategyRow = {
  id: string;
  name: string;
  slug: string;
  quantScore: number;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

const VIS_LABELS = {
  PUBLIC: { label: "Public", icon: Globe },
  FRIENDS: { label: "Friends", icon: Users },
  PRIVATE: { label: "Private", icon: Lock },
} as const;

export function MyStrategiesPanel({
  strategies,
  onChanged,
}: {
  strategies: MyStrategyRow[];
  onChanged: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function setVisibility(slug: string, visibility: MyStrategyRow["visibility"]) {
    setBusy(slug);
    setMsg("");
    const res = await fetch(`/api/strategies/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ visibility }),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error ?? "Update failed");
      return;
    }
    onChanged();
  }

  async function duplicate(slug: string) {
    setBusy(`dup-${slug}`);
    setMsg("");
    const res = await fetch(`/api/strategies/${slug}/duplicate`, {
      method: "POST",
      credentials: "same-origin",
    });
    const d = await res.json();
    setBusy(null);
    if (!res.ok) {
      setMsg(d.error ?? "Duplicate failed");
      return;
    }
    setMsg("Strategy duplicated (private copy)");
    onChanged();
    if (d.strategy?.slug) router.push(`/strategies/${d.strategy.slug}`);
  }

  async function remove(slug: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(`del-${slug}`);
    setMsg("");
    const res = await fetch(`/api/strategies/${slug}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error ?? "Delete failed");
      return;
    }
    onChanged();
  }

  if (strategies.length === 0) {
    return (
      <GlassCard>
        <p className="text-sm text-[var(--foreground-muted)]">
          You haven&apos;t published any strategies yet.{" "}
          <Link href="/builder" className="text-[var(--camel)] hover:underline">
            Open the builder
          </Link>{" "}
          to create one.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {msg && (
        <p className="text-sm text-[var(--camel)]">{msg}</p>
      )}
      {strategies.map((s) => {
        const vis = VIS_LABELS[s.visibility] ?? VIS_LABELS.PRIVATE;
        const Icon = vis.icon;
        const isPreset = s.slug.startsWith("preset-");
        return (
          <GlassCard key={s.id} className="!py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/strategies/${s.slug}`}
                  className="font-semibold hover:text-[var(--camel)]"
                >
                  {s.name}
                </Link>
                <p className="mt-1 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                  <Icon className="h-3 w-3" />
                  {vis.label} · Quant {s.quantScore}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(["PUBLIC", "FRIENDS", "PRIVATE"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={busy === s.slug || isPreset}
                    onClick={() => setVisibility(s.slug, v)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-xs transition-colors",
                      s.visibility === v
                        ? "border-[var(--camel)] bg-[var(--camel)]/15 text-[var(--camel)]"
                        : "border-white/10 text-[var(--foreground-muted)] hover:border-white/20",
                      isPreset && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {VIS_LABELS[v].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!!busy}
                onClick={() => duplicate(s.slug)}
              >
                <Copy className="mr-1 h-3 w-3" />
                {busy === `dup-${s.slug}` ? "…" : "Duplicate"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!!busy || isPreset}
                onClick={() => remove(s.slug, s.name)}
                className="text-loss hover:text-loss"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {busy === `del-${s.slug}` ? "…" : "Delete"}
              </Button>
            </div>
            {isPreset && (
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                Preset deployments are managed under Bots — visibility applies to
                marketplace copies you publish from Builder.
              </p>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
