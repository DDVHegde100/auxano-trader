"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationDto } from "@/lib/notifications/types";

type NotificationState = {
  items: NotificationDto[];
  grouped: {
    key: string;
    label: string;
    items: NotificationDto[];
    latestAt: string;
  }[];
  unreadCount: number;
};

export function useNotifications(pollMs = 25_000) {
  const [data, setData] = useState<NotificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUnread = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=40", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const json = await res.json();
      setData(json);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        json.unreadCount > lastUnread.current &&
        json.items?.[0]
      ) {
        const latest = json.items[0] as NotificationDto;
        if (!latest.read) {
          new Notification(latest.title, {
            body: latest.body,
            tag: latest.id,
            icon: "/favicon.ico",
          });
        }
      }
      lastUnread.current = json.unreadCount ?? 0;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({}),
    });
    refresh();
  }, [refresh]);

  const markRead = useCallback(
    async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ids }),
      });
      refresh();
    },
    [refresh]
  );

  return {
    data,
    loading,
    refresh,
    markAllRead,
    markRead,
    unreadCount: data?.unreadCount ?? 0,
  };
}
