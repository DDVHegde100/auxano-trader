import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { useAppAuth } from "@/src/hooks/useAuth";

type BotRow = {
  id: string;
  strategyName: string;
  primarySymbol: string;
  autopilotStatus: string;
  lastSignal: string | null;
  intervalMinutes: number;
  allocated: number;
  totalAutopilotTrades: number;
  attributedRealizedPnl: number;
  unrealizedPnl: number;
  lastError: string | null;
};

export default function BotsScreen() {
  const { getToken } = useAppAuth();
  const router = useRouter();
  const [bots, setBots] = useState<BotRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<{ bots: BotRow[] }>("/api/autopilot/bots", {
        token: token ?? undefined,
      });
      setBots(data.bots ?? []);
    } catch {
      setBots([]);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function togglePause(bot: BotRow) {
    const token = await getToken();
    const next = bot.autopilotStatus === "RUNNING" ? "PAUSED" : "RUNNING";
    await apiFetch(`/api/autopilot/bots/${bot.id}`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify({ autopilotStatus: next }),
    });
    load();
  }

  async function runNow(id: string) {
    const token = await getToken();
    await apiFetch(`/api/autopilot/bots/${id}/run`, {
      method: "POST",
      token: token ?? undefined,
    });
    load();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Bots</Text>
        <Text style={styles.sub}>
          Autopilot runs your deployed strategies on a schedule
        </Text>

        {bots.length === 0 ? (
          <GlassCard>
            <Text style={styles.muted}>
              Deploy a strategy from Algo or More to start a paper bot.
            </Text>
            <PrimaryButton
              label="Open marketplace"
              onPress={() => router.push("/(tabs)/marketplace")}
              variant="secondary"
            />
          </GlassCard>
        ) : (
          bots.map((b) => (
            <GlassCard key={b.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{b.strategyName}</Text>
                <Text style={styles.badge}>{b.autopilotStatus}</Text>
              </View>
              <Text style={styles.muted}>
                {b.primarySymbol} · ${b.allocated.toLocaleString()} · every{" "}
                {b.intervalMinutes}m
              </Text>
              <Text style={styles.signal}>
                Last: {b.lastSignal ?? "—"} · {b.totalAutopilotTrades} trades
              </Text>
              <Text
                style={[
                  styles.pnl,
                  b.attributedRealizedPnl + b.unrealizedPnl >= 0
                    ? { color: theme.success }
                    : { color: theme.loss },
                ]}
              >
                Realized ${b.attributedRealizedPnl.toFixed(2)} · Open $
                {b.unrealizedPnl.toFixed(2)}
              </Text>
              {b.lastError ? (
                <Text style={styles.err}>{b.lastError}</Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable onPress={() => runNow(b.id)}>
                  <Text style={styles.link}>Run now</Text>
                </Pressable>
                <Pressable onPress={() => togglePause(b)}>
                  <Text style={styles.link}>
                    {b.autopilotStatus === "RUNNING" ? "Pause" : "Resume"}
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginBottom: 20 },
  card: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontWeight: "600", color: theme.textPrimary, fontSize: 16 },
  badge: { color: theme.accent, fontSize: 11, fontWeight: "700" },
  muted: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  signal: { color: theme.textPrimary, fontSize: 13, marginTop: 8 },
  pnl: { fontSize: 13, marginTop: 4, fontWeight: "600" },
  err: { color: theme.loss, fontSize: 11, marginTop: 6 },
  actions: { flexDirection: "row", gap: 16, marginTop: 12 },
  link: { color: theme.success, fontWeight: "600" },
});
