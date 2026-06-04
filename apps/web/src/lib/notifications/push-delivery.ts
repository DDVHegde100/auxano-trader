import type { NotificationMetadata } from "@/lib/notifications/types";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  data?: Record<string, unknown>;
};

/** Send push notifications via Expo Push API (mobile). */
export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: NotificationMetadata & { type?: string }
): Promise<void> {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return;

  const messages: ExpoPushMessage[] = unique.map((to) => ({
    to,
    title,
    body,
    sound: "default",
    data: data as Record<string, unknown> | undefined,
  }));

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.warn("[push] Expo API error", await res.text());
    }
  } catch (e) {
    console.warn("[push] delivery failed", e);
  }
}
