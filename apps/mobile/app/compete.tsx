import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatPct } from "@/src/lib/format";
import { useAppAuth } from "@/src/hooks/useAuth";

type LeagueSummary = {
  id: string;
  title: string;
  rulesSummary: string;
  period: string;
  scope: string;
  endsAt: string;
  participantCount: number;
  viewerRank: number | null;
  viewerReturnPct: number | null;
};

type DuelSummary = {
  id: string;
  title: string;
  status: string;
  inviteUrl: string;
  creatorReturnPct: number | null;
  isCreator: boolean;
};

export default function CompeteScreen() {
  const router = useRouter();
  const { getToken } = useAppAuth();
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [duels, setDuels] = useState<DuelSummary[]>([]);
  const [opponent, setOpponent] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiFetch<{ leagues: LeagueSummary[]; duels: DuelSummary[] }>(
        "/api/compete",
        { token: token ?? undefined }
      );
      setLeagues(data.leagues ?? []);
      setDuels(data.duels ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function createDuel() {
    const token = await getToken();
    try {
      const res = await apiFetch<{ duel: { inviteUrl: string; id: string } }>(
        "/api/compete/duels",
        {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify({
            opponentUsername: opponent.trim() || undefined,
            durationDays: 7,
          }),
        }
      );
      Alert.alert("Challenge created", res.duel.inviteUrl);
      load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.success} />
        }
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Compete</Text>
        <Text style={styles.sub}>
          Weekly & monthly leagues · 1v1 paper duels
        </Text>

        <SectionHeader title="Active leagues" />
        {loading && <Text style={styles.muted}>Loading…</Text>}
        {leagues.map((l) => (
          <GlassCard key={l.id} style={styles.card}>
            <Text style={styles.cardTitle}>{l.title}</Text>
            <Text style={styles.muted}>
              {l.period} · {l.scope} · {l.participantCount} traders
            </Text>
            {l.viewerRank != null && (
              <Text style={styles.rank}>
                #{l.viewerRank}{" "}
                {l.viewerReturnPct != null ? formatPct(l.viewerReturnPct) : ""}
              </Text>
            )}
            <Text style={styles.rules}>{l.rulesSummary}</Text>
          </GlassCard>
        ))}

        <SectionHeader title="Head-to-head" subtitle="Challenge a friend" />
        <GlassCard>
          <TextInput
            style={styles.input}
            placeholder="@username (optional)"
            placeholderTextColor={theme.textSecondary}
            value={opponent}
            onChangeText={setOpponent}
            autoCapitalize="none"
          />
          <PrimaryButton label="Create 7-day duel" onPress={createDuel} />
        </GlassCard>

        {duels.length > 0 && (
          <>
            <SectionHeader title="Your duels" />
            {duels.map((d) => (
              <GlassCard key={d.id} style={styles.card}>
                <Text style={styles.cardTitle}>{d.title}</Text>
                <Text style={styles.muted}>{d.status}</Text>
                {d.creatorReturnPct != null && d.isCreator && (
                  <Text style={styles.rank}>{formatPct(d.creatorReturnPct)}</Text>
                )}
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 48 },
  back: { color: theme.accent, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginBottom: 20 },
  card: { marginBottom: 12 },
  cardTitle: { fontWeight: "600", color: theme.textPrimary, fontSize: 16 },
  muted: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  rank: { color: theme.success, fontWeight: "700", marginTop: 8, fontSize: 18 },
  rules: { color: theme.textSecondary, fontSize: 12, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    color: theme.textPrimary,
    marginBottom: 12,
  },
});
