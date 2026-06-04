import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { useAppAuth } from "@/src/hooks/useAuth";

export type MobileNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: { href?: string };
  createdAt: string;
};

export function useNotifications() {
  const { getToken } = useAppAuth();
  const [items, setItems] = useState<MobileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<{
        items: MobileNotification[];
        unreadCount: number;
      }>("/api/notifications?limit=50", { token: token ?? undefined });
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const token = await getToken();
    await apiFetch("/api/notifications", {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify({}),
    });
    refresh();
  }, [getToken, refresh]);

  return { items, unreadCount, loading, refresh, markAllRead };
}
