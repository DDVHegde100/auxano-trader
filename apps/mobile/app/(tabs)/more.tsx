import { useAppAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { LaymanScoreRing } from "@/src/components/LaymanScoreRing";
import { MiniChart } from "@/src/components/MiniChart";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatPct, formatUsd } from "@/src/lib/format";
import { PRESET_ALGORITHMS } from "@auxano/shared";
import { ShareSheet } from "@/src/components/ShareSheet";
import { NotificationBell } from "@/src/components/NotificationBell";

const SYMBOLS = ["AAPL", "NVDA", "MSFT", "TSLA", "GOOGL"];

export default function MoreScreen() {
  const { signOut, getToken } = useAppAuth();
  const router = useRouter();
  const [leaders, setLeaders] = useState<{
    topStrategies: { name: string; quantScore: number; slug: string }[];
    topTraders: { user: { name: string }; returnPct: number; portfolioValue: number }[];
  } | null>(null);
  const [backtestSymbol, setBacktestSymbol] = useState("AAPL");
  const [presetId, setPresetId] = useState("steady-grower");
  const [btLoading, setBtLoading] = useState(false);
  const [btResult, setBtResult] = useState<{
    layman: { score: number; grade: string; headline: string; summary: string };
    metrics: { annualReturn: number; winRate: number; maxDrawdown: number };
    equityCurve: { date: string; value: number }[];
  } | null>(null);
  const [showBt, setShowBt] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<typeof leaders>("/api/leaderboard").then(setLeaders);
    (async () => {
      try {
        const token = await getToken();
        const profile = await apiFetch<{ user?: { username?: string } }>(
          "/api/user/profile",
          { token: token ?? undefined }
        );
        setUsername(profile.user?.username ?? null);
      } catch {
        setUsername(null);
      }
    })();
  }, []);

  async function runBacktest() {
    setBtLoading(true);
    const preset = PRESET_ALGORITHMS.find((p) => p.id === presetId);
    if (!preset) return;
    try {
      const res = await apiFetch<typeof btResult>("/api/algorithms/rate", {
        method: "POST",
        body: JSON.stringify({
          logicJson: preset.logic,
          symbol: backtestSymbol,
          days: 252,
        }),
      });
      setBtResult(res);
      setShowBt(true);
    } finally {
      setBtLoading(false);
    }
  }

  async function deployPreset(id: string) {
    const token = await getToken();
    await apiFetch("/api/algorithms/deploy", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ presetId: id, allocated: 25000 }),
    });
    router.push("/(tabs)/dashboard");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={styles.title}>More</Text>
            <Text style={styles.sub}>Backtest, leaderboard, and account</Text>
          </View>
          <NotificationBell />
        </View>
        <Pressable onPress={() => router.push("/notifications")}>
          <Text style={styles.notifLink}>Open notification inbox →</Text>
        </Pressable>

        <SectionHeader title="Algorithm backtester" subtitle="Test before you deploy" />
        <GlassCard>
          <Text style={styles.label}>Preset strategy</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PRESET_ALGORITHMS.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.chip, presetId === p.id && styles.chipOn]}
                onPress={() => setPresetId(p.id)}
              >
                <Text style={presetId === p.id ? styles.chipOnText : styles.chipText}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[styles.label, { marginTop: 12 }]}>Symbol</Text>
          <View style={styles.symRow}>
            {SYMBOLS.map((s) => (
              <Pressable
                key={s}
                style={[styles.symChip, backtestSymbol === s && styles.chipOn]}
                onPress={() => setBacktestSymbol(s)}
              >
                <Text style={backtestSymbol === s ? styles.chipOnText : styles.chipText}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton
            label={btLoading ? "Running simulation…" : "Run backtest & rate"}
            onPress={runBacktest}
            loading={btLoading}
            variant="primary"
          />
        </GlassCard>

        <SectionHeader title="One-tap deploy" />
        {PRESET_ALGORITHMS.map((p) => (
          <Pressable key={p.id} onPress={() => deployPreset(p.id)}>
            <GlassCard style={styles.deployRow}>
              <View style={styles.flex}>
                <Text style={styles.deployName}>{p.name}</Text>
                <Text style={styles.deployTag}>{p.tagline}</Text>
              </View>
              <Text style={styles.deployArrow}>Deploy →</Text>
            </GlassCard>
          </Pressable>
        ))}

        {username ? (
          <>
            <SectionHeader title="Share performance" subtitle="Branded card + public link" />
            <ShareSheet username={username} />
          </>
        ) : null}

        <SectionHeader title="Leaderboard" />
        <Text style={styles.lbSection}>Top strategies</Text>
        {leaders?.topStrategies?.slice(0, 5).map((s, i) => (
          <Pressable key={s.slug} onPress={() => router.push(`/strategy/${s.slug}`)}>
            <GlassCard style={styles.lbRow}>
              <Text style={styles.lbRank}>#{i + 1}</Text>
              <Text style={styles.lbName}>{s.name}</Text>
              <Text style={styles.lbScore}>Quant {s.quantScore}</Text>
            </GlassCard>
          </Pressable>
        ))}
        <Text style={[styles.lbSection, { marginTop: 16 }]}>Top paper traders</Text>
        {leaders?.topTraders?.slice(0, 5).map((t, i) => (
          <GlassCard key={i} style={styles.lbRow}>
            <Text style={styles.lbRank}>#{i + 1}</Text>
            <Text style={styles.lbName}>{t.user.name}</Text>
            <Text style={[styles.lbScore, { color: theme.success }]}>
              {formatPct(t.returnPct)}
            </Text>
          </GlassCard>
        ))}

        <SectionHeader title="Account" />
        <PrimaryButton label="Sign out" onPress={() => signOut()} variant="danger" />
      </ScrollView>

      <Modal visible={showBt} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <ScrollView contentContainerStyle={modalStyles.sheet}>
            {btResult ? (
              <>
                <LaymanScoreRing
                  score={btResult.layman.score}
                  grade={btResult.layman.grade}
                  size="lg"
                />
                <Text style={modalStyles.headline}>{btResult.layman.headline}</Text>
                <Text style={modalStyles.summary}>{btResult.layman.summary}</Text>
                <View style={modalStyles.metrics}>
                  <Metric label="Return" value={formatPct(btResult.metrics.annualReturn)} />
                  <Metric label="Win rate" value={`${btResult.metrics.winRate.toFixed(0)}%`} />
                  <Metric
                    label="Max drop"
                    value={`${btResult.metrics.maxDrawdown.toFixed(1)}%`}
                  />
                </View>
                {btResult.equityCurve?.length ? (
                  <MiniChart
                    data={btResult.equityCurve.map((p) => p.value)}
                    height={100}
                    positive={btResult.metrics.annualReturn >= 0}
                  />
                ) : null}
                <PrimaryButton label="Close" onPress={() => setShowBt(false)} />
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={modalStyles.metric}>
      <Text style={modalStyles.metricVal}>{value}</Text>
      <Text style={modalStyles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 48 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginBottom: 8 },
  notifLink: { color: theme.accent, fontSize: 14, marginBottom: 16 },
  label: { color: theme.textSecondary, fontSize: 13, marginBottom: 8 },
  chip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    alignItems: "center",
    minWidth: 100,
  },
  chipOn: { borderColor: theme.success, backgroundColor: "rgba(188,138,95,0.1)" },
  chipEmoji: { fontSize: 20 },
  chipText: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  chipOnText: { color: theme.success, fontWeight: "600", fontSize: 12, marginTop: 4 },
  symRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  symChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  deployRow: { flexDirection: "row", alignItems: "center" },
  deployEmoji: { fontSize: 28, marginRight: 12 },
  flex: { flex: 1 },
  deployName: { fontWeight: "600", color: theme.textPrimary },
  deployTag: { color: theme.textSecondary, fontSize: 12 },
  deployArrow: { color: theme.success, fontWeight: "600" },
  lbSection: { color: theme.textSecondary, fontSize: 13, marginBottom: 8 },
  lbRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  lbRank: { width: 32, color: theme.textSecondary, fontWeight: "700" },
  lbName: { flex: 1, color: theme.textPrimary, fontWeight: "500" },
  lbScore: { color: theme.textSecondary, fontSize: 13 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    paddingBottom: 48,
  },
  headline: { fontSize: 20, fontWeight: "700", color: theme.textPrimary, marginTop: 16, textAlign: "center" },
  summary: { color: theme.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 22 },
  metrics: { flexDirection: "row", marginVertical: 20, gap: 24 },
  metric: { alignItems: "center" },
  metricVal: { fontSize: 18, fontWeight: "700", color: theme.textPrimary },
  metricLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 4 },
});
