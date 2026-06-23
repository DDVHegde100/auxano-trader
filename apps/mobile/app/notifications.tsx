import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GlassCard } from "@/src/components/GlassCard";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { theme } from "@/src/lib/theme";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useAppAuth } from "@/src/hooks/useAuth";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";
import { AuthLoadingScreen } from "@/src/components/AuthLoadingScreen";
import { registerForPushNotifications } from "@/src/lib/push-notifications";
import { apiFetch } from "@/src/lib/api";

export default function NotificationsScreen() {
  const router = useRouter();
  const authed = useRequireAuth();
  const { getToken } = useAppAuth();
  const { items, unreadCount, loading, markAllRead, refresh } = useNotifications();
  const [pushOn, setPushOn] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await apiFetch<{ prefs: { pushEnabled: boolean } }>(
        "/api/notifications/preferences",
        { token: token ?? undefined }
      );
      setPushOn(res.prefs?.pushEnabled ?? true);
    })();
  }, [getToken]);

  async function enablePhonePush() {
    try {
      const token = await registerForPushNotifications(getToken);
      if (token) {
        Alert.alert("Push enabled", "You will receive alerts on this device.");
      } else {
        Alert.alert(
          "Permission needed",
          "Allow notifications in Settings to receive trade and friend alerts."
        );
      }
    } catch {
      Alert.alert("Error", "Could not register for push on this device.");
    }
  }

  if (!authed) return <AuthLoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.sub}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </Text>

        <GlassCard style={styles.pushCard}>
          <Text style={styles.cardTitle}>Push on this phone</Text>
          <Text style={styles.cardSub}>
            Friend requests, trade fills, leaderboard passes, and strategy alerts.
          </Text>
          <PrimaryButton
            label="Allow push notifications"
            onPress={enablePhonePush}
            variant="primary"
          />
        </GlassCard>

        {unreadCount > 0 && (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        )}

        {loading && <Text style={styles.muted}>Loading…</Text>}

        {items.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => {
              if (n.metadata?.href) {
                const href = n.metadata.href;
                if (href.startsWith("/strategies/")) {
                  const slug = href.replace("/strategies/", "");
                  router.push(`/strategy/${slug}`);
                } else if (href === "/friends") {
                  router.push("/(tabs)/more");
                } else {
                  router.push("/(tabs)/dashboard");
                }
              }
            }}
          >
            <GlassCard
              style={[styles.row, !n.read && styles.rowUnread]}
            >
              <Text style={styles.rowTitle}>{n.title}</Text>
              <Text style={styles.rowBody}>{n.body}</Text>
              <Text style={styles.rowTime}>
                {new Date(n.createdAt).toLocaleString()}
              </Text>
            </GlassCard>
          </Pressable>
        ))}

        {!loading && !items.length && (
          <Text style={styles.muted}>
            No notifications yet. Trade or add friends to get started.
          </Text>
        )}

        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>Push enabled (account)</Text>
          <Switch
            value={pushOn}
            onValueChange={async (v) => {
              setPushOn(v);
              const token = await getToken();
              await apiFetch("/api/notifications/preferences", {
                method: "PATCH",
                token: token ?? undefined,
                body: JSON.stringify({ pushEnabled: v }),
              });
            }}
            trackColor={{ true: theme.accent }}
          />
        </View>

        <Pressable onPress={refresh}>
          <Text style={styles.refresh}>Refresh inbox</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 40 },
  back: { color: theme.accent, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "600", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginTop: 4, marginBottom: 20 },
  pushCard: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: theme.textPrimary },
  cardSub: { fontSize: 13, color: theme.textSecondary, marginVertical: 8, lineHeight: 18 },
  markAll: { color: theme.accent, textAlign: "right", marginBottom: 12 },
  row: { marginBottom: 10 },
  rowUnread: { borderColor: theme.accent, borderWidth: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: theme.textPrimary },
  rowBody: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
  rowTime: { fontSize: 11, color: theme.textMuted, marginTop: 8 },
  muted: { color: theme.textSecondary, textAlign: "center", marginTop: 24 },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingVertical: 12,
  },
  prefLabel: { color: theme.textPrimary, fontSize: 15 },
  refresh: { color: theme.accent, textAlign: "center", marginTop: 16 },
});
