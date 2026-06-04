"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/auxano/glass-card";
import { PushPermissionBanner } from "@/components/notifications/push-permission-banner";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications/types";
import type { NotificationDto, NotificationPrefsDto } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";
import { Bell, Settings2 } from "lucide-react";

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "social", label: "Friends" },
  { id: "trading", label: "Trading" },
  { id: "leaderboard", label: "Leaderboard" },
] as const;

function PrefToggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.02]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded"
      />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-[var(--foreground-muted)]">{desc}</p>
      </div>
    </label>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefsDto | null>(null);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [grouped, setGrouped] = useState<
    { key: string; label: string; items: NotificationDto[] }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<"inbox" | "settings">("inbox");

  const { markAllRead, markRead } = useNotifications(30_000);

  const load = useCallback(async () => {
    const q = category ? `?category=${category}&limit=60` : "?limit=60";
    const [nRes, pRes] = await Promise.all([
      fetch(`/api/notifications${q}`, { credentials: "same-origin" }),
      fetch("/api/notifications/preferences", { credentials: "same-origin" }),
    ]);
    const nJson = await nRes.json();
    const pJson = await pRes.json();
    setItems(nJson.items ?? []);
    setGrouped(nJson.grouped ?? []);
    setUnreadCount(nJson.unreadCount ?? 0);
    setPrefs(pJson.prefs ?? null);
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePrefs(patch: Partial<NotificationPrefsDto>) {
    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    setPrefs(json.prefs);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-[var(--camel)]" />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="text-[var(--foreground-muted)]">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead().then(load)}>
            Mark all read
          </Button>
        )}
      </div>

      <PushPermissionBanner />

      <div className="flex gap-2 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={cn(
            "px-4 py-2 text-sm",
            tab === "inbox" && "border-b-2 border-[var(--camel)]"
          )}
        >
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={cn(
            "flex items-center gap-1 px-4 py-2 text-sm",
            tab === "settings" && "border-b-2 border-[var(--camel)]"
          )}
        >
          <Settings2 className="h-4 w-4" /> Preferences
        </button>
      </div>

      {tab === "inbox" && (
        <>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  category === c.id
                    ? "border-[var(--camel)]/50 bg-[var(--camel)]/15 text-[var(--camel)]"
                    : "border-white/[0.08] text-[var(--foreground-muted)]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {grouped.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-[var(--foreground-muted)]">
                Grouped feed
              </h2>
              {grouped.map((g) => (
                <GlassCard key={g.key} className="!p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-[var(--camel)]">
                    {g.label} · {g.items.length}
                  </p>
                  {g.items.slice(0, 3).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="mb-2 block w-full text-left text-sm last:mb-0"
                      onClick={() => {
                        if (!n.read) markRead([n.id]);
                        if (n.metadata?.href) router.push(n.metadata.href);
                      }}
                    >
                      <span className="font-medium">{n.title}</span>
                      <span className="text-[var(--foreground-muted)]"> — {n.body}</span>
                    </button>
                  ))}
                </GlassCard>
              ))}
            </section>
          )}

          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className="w-full text-left"
                onClick={() => {
                  if (!n.read) markRead([n.id]);
                  if (n.metadata?.href) router.push(n.metadata.href);
                }}
              >
                <GlassCard
                  interactive
                  className={cn("!py-3", !n.read && "border-[var(--camel)]/25")}
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      {NOTIFICATION_TYPE_LABELS[n.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{n.body}</p>
                  <p className="mt-2 text-[10px] text-[var(--foreground-muted)]/60">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </GlassCard>
              </button>
            ))}
            {!items.length && (
              <p className="text-center text-sm text-[var(--foreground-muted)] py-12">
                No notifications in this category yet. Trade, add friends, or deploy a strategy
                to see alerts here.
              </p>
            )}
          </div>
        </>
      )}

      {tab === "settings" && prefs && (
        <GlassCard className="space-y-3">
          <h2 className="text-lg font-semibold">Notification preferences</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Control in-app and mobile push categories. Mobile push uses Expo after you allow
            notifications on your phone.
          </p>
          <PrefToggle
            label="Push notifications (master)"
            desc="Send to your registered phone via Expo when events occur"
            checked={prefs.pushEnabled}
            onChange={(v) => updatePrefs({ pushEnabled: v })}
          />
          <PrefToggle
            label="In-app inbox"
            desc="Show notifications inside Auxano"
            checked={prefs.inAppEnabled}
            onChange={(v) => updatePrefs({ inAppEnabled: v })}
          />
          <PrefToggle
            label="Friends & social"
            desc="Requests, accepts, and social activity"
            checked={prefs.notifyFriends}
            onChange={(v) => updatePrefs({ notifyFriends: v })}
          />
          <PrefToggle
            label="Trading"
            desc="Paper trade fill confirmations"
            checked={prefs.notifyTrading}
            onChange={(v) => updatePrefs({ notifyTrading: v })}
          />
          <PrefToggle
            label="Leaderboard"
            desc="When a friend passes your paper trader rank"
            checked={prefs.notifyLeaderboard}
            onChange={(v) => updatePrefs({ notifyLeaderboard: v })}
          />
          <PrefToggle
            label="Strategies"
            desc="Deployments and strategy alerts"
            checked={prefs.notifyStrategies}
            onChange={(v) => updatePrefs({ notifyStrategies: v })}
          />
          <PrefToggle
            label="Autopilot errors"
            desc="When automated paper bots pause or fail"
            checked={prefs.notifyAutopilot}
            onChange={(v) => updatePrefs({ notifyAutopilot: v })}
          />
          <p className="pt-2 text-xs text-[var(--foreground-muted)]">
            Mobile device: {prefs.hasExpoPushToken ? "registered" : "not registered — open the mobile app and allow push"}
          </p>
          <Link href="/friends" className="text-sm text-[var(--camel)] hover:underline">
            Manage friends →
          </Link>
        </GlassCard>
      )}
    </div>
  );
}
