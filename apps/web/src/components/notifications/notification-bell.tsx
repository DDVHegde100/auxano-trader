"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications/types";
import type { NotificationDto } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function NotificationRow({
  n,
  onRead,
}: {
  n: NotificationDto;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (!n.read) onRead(n.id);
        if (n.metadata?.href) router.push(n.metadata.href);
      }}
      className={cn(
        "w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06]",
        !n.read && "bg-[var(--camel)]/[0.08]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{n.title}</p>
        <span className="shrink-0 text-[10px] text-[var(--foreground-muted)]">
          {timeAgo(n.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--foreground-muted)] line-clamp-2">
        {n.body}
      </p>
      <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-[var(--camel)]/80">
        {NOTIFICATION_TYPE_LABELS[n.type]}
      </span>
    </button>
  );
}

export function NotificationBell() {
  const { data, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
      >
        <Bell className="h-5 w-5 text-[var(--foreground-muted)]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--camel)] px-1 text-[10px] font-bold text-[#1a1209]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1f1610] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
            <p className="font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs text-[var(--camel)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {(data?.items ?? []).length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--foreground-muted)]">
                You&apos;re all caught up
              </p>
            ) : (
              data?.items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onRead={(id) => markRead([id])}
                />
              ))
            )}
          </div>
          <div className="border-t border-white/[0.08] p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-lg py-2 text-center text-sm text-[var(--camel)] hover:bg-white/[0.04]"
            >
              Open inbox & preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
