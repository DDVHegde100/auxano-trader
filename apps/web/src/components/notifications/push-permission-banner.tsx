"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "auxano_push_banner_dismissed";

export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (Notification.permission === "default") {
      setVisible(true);
    }
  }, []);

  async function enablePush() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setStatus("Browser notifications enabled");
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ webPushEnabled: true, pushEnabled: true }),
      });
      setVisible(false);
    } else {
      setStatus("Permission denied — you can enable later in browser settings");
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return status ? (
    <p className="text-xs text-[var(--camel)]">{status}</p>
  ) : null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--camel)]/30 bg-[var(--camel)]/10 px-4 py-3">
      <BellRing className="h-5 w-5 shrink-0 text-[var(--camel)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Enable push notifications</p>
        <p className="text-xs text-[var(--foreground-muted)]">
          Get alerts for trades, friend requests, and leaderboard moves on this device.
        </p>
      </div>
      <Button size="sm" onClick={enablePush}>
        Allow
      </Button>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-lg p-1 text-[var(--foreground-muted)] hover:bg-white/[0.06]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
