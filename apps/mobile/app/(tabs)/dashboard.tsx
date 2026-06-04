import { useAppAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { MiniChart } from "@/src/components/MiniChart";
import { LaymanScoreRing } from "@/src/components/LaymanScoreRing";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatUsd, formatPct, formatTime } from "@/src/lib/format";
import { usePolling } from "@/src/hooks/usePolling";
import type { DashboardData } from "@auxano/shared";

interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

export default function DashboardScreen() {
  const { getToken } = useAppAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [liveQuotes, setLiveQuotes] = useState<LiveQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [deployMsg, setDeployMsg] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    try {
      const [dash, live] = await Promise.all([
        apiFetch<DashboardData>("/api/dashboard", { token: token ?? undefined }),
        apiFetch<{ quotes: LiveQuote[]; refreshedAt: string }>("/api/market/live"),
      ]);
      setData(dash);
      setLiveQuotes(live.quotes?.slice(0, 5) ?? []);
      setLastRefresh(formatTime(live.refreshedAt ?? new Date().toISOString()));
    } catch {
      setData(null);
    }
  }, [getToken]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  usePolling(load, 8000, !loading);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function quickDeployPreset() {
    setDeployMsg("");
    const token = await getToken();
    try {
      const res = await apiFetch<{
        layman: { score: number; grade: string };
        strategy: { name: string };
      }>("/api/algorithms/deploy", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ presetId: "steady-grower", allocated: 15000 }),
      });
      setDeployMsg(
        `Deployed ${res.strategy.name} · Strength ${res.layman.score}/100 (${res.layman.grade})`
      );
      await load();
    } catch (e) {
      setDeployMsg(e instanceof Error ? e.message : "Deploy failed");
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, styles.container]}>
        <ActivityIndicator color={theme.success} size="large" />
        <Text style={styles.loadingText}>Loading your growth dashboard…</Text>
      </View>
    );
  }

  const s = data?.summary;
  const perfValues = data?.performance?.map((p) => p.value) ?? [];
  const up = (s?.todayPnl ?? 0) >= 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.success} />
        }
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>Auxano</Text>
            <Text style={styles.live}>Live · updated {lastRefresh}</Text>
          </View>
          <LaymanScoreRing
            score={Math.min(100, Math.round((s?.totalReturnPct ?? 0) + 50))}
            grade="You"
            size="sm"
          />
        </View>

        <GlassCard glow style={styles.heroCard}>
          <Text style={styles.label}>Portfolio Value</Text>
          <Text style={styles.hero}>{s ? formatUsd(s.portfolioValue) : "—"}</Text>
          <View style={styles.pnlRow}>
            <Text style={[styles.pnl, { color: up ? theme.success : theme.loss }]}>
              {s ? `${formatUsd(s.todayPnl)} (${formatPct(s.todayPnlPct)})` : "—"} today
            </Text>
          </View>
          {perfValues.length > 1 ? (
            <View style={styles.chartWrap}>
              <MiniChart data={perfValues} height={100} positive={up} />
            </View>
          ) : null}
        </GlassCard>

        <View style={styles.grid}>
          <StatTile label="Total return" value={s ? formatPct(s.totalReturnPct) : "—"} accent />
          <StatTile label="Paper cash" value={s ? formatUsd(s.cashBalance, true) : "—"} />
          <StatTile label="Positions" value={s ? formatUsd(s.positionsValue, true) : "—"} />
          <StatTile
            label="Strategies"
            value={String(s?.activeStrategies ?? 0)}
            onPress={() => router.push("/(tabs)/marketplace")}
          />
        </View>

        <SectionHeader
          title="Quick actions"
          subtitle="Every button executes a real API call"
        />
        <View style={styles.actionRow}>
          <PrimaryButton
            label="Trade"
            onPress={() => router.push("/(tabs)/trade")}
            variant="primary"
            style={styles.actionBtn}
          />
          <PrimaryButton
            label="Portfolio"
            onPress={() => router.push("/(tabs)/portfolio")}
            variant="ghost"
            style={styles.actionBtn}
          />
        </View>
        <PrimaryButton
          label="Deploy Steady Grower (beginner preset)"
          onPress={quickDeployPreset}
          variant="primary"
        />
        {deployMsg ? <Text style={styles.msg}>{deployMsg}</Text> : null}

        <SectionHeader
          title="Live movers"
          subtitle="Prices refresh every 8s"
          actionLabel="Trade"
          onAction={() => router.push("/(tabs)/trade")}
        />
        {liveQuotes.map((q) => (
          <Pressable
            key={q.symbol}
            onPress={() => router.push({ pathname: "/(tabs)/trade", params: { symbol: q.symbol } })}
          >
            <GlassCard style={styles.mover}>
              <Text style={styles.moverSym}>{q.symbol}</Text>
              <Text style={styles.moverPrice}>{formatUsd(q.price)}</Text>
              <Text style={{ color: q.changePct >= 0 ? theme.success : theme.loss }}>
                {formatPct(q.changePct)}
              </Text>
            </GlassCard>
          </Pressable>
        ))}

        <SectionHeader title="Allocation" />
        {(data?.allocation ?? []).map((a) => (
          <View key={a.label} style={styles.allocRow}>
            <Text style={styles.allocLabel}>{a.label}</Text>
            <View style={styles.allocBarBg}>
              <View
                style={[
                  styles.allocBar,
                  {
                    width: `${s ? (a.value / s.portfolioValue) * 100 : 0}%`,
                    backgroundColor: a.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.allocPct}>
              {s ? ((a.value / s.portfolioValue) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        ))}

        <SectionHeader title="Recent trades" actionLabel="See all" onAction={() => router.push("/(tabs)/portfolio")} />
        {!data?.recentTrades?.length ? (
          <GlassCard>
            <Text style={styles.muted}>No trades yet — buy your first stock in Trade.</Text>
          </GlassCard>
        ) : (
          data.recentTrades.map((t) => (
            <GlassCard key={t.id} style={styles.tradeCard}>
              <View style={styles.tradeRow}>
                <Text style={styles.tradeSym}>
                  {t.symbol}{" "}
                  <Text style={{ color: t.side === "BUY" ? theme.success : theme.loss }}>
                    {t.side}
                  </Text>
                </Text>
                <Text style={styles.tradeAmt}>
                  {t.quantity} @ {formatUsd(t.price)}
                </Text>
              </View>
              <Text style={styles.muted}>{new Date(t.executedAt).toLocaleString()}</Text>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  accent,
  onPress,
}: {
  label: string;
  value: string;
  accent?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <GlassCard style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: theme.success }]}>{value}</Text>
    </GlassCard>
  );
  if (onPress) return <Pressable onPress={onPress} style={styles.statWrap}>{inner}</Pressable>;
  return <View style={styles.statWrap}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: "center", justifyContent: "center" },
  loadingText: { color: theme.textSecondary, marginTop: 16 },
  scroll: { padding: 20, paddingBottom: 48 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  brand: { fontSize: 13, color: theme.textSecondary, letterSpacing: 2, textTransform: "uppercase" },
  live: { fontSize: 11, color: theme.success, marginTop: 2 },
  heroCard: { marginBottom: 16 },
  label: { color: theme.textSecondary, fontSize: 14 },
  hero: { fontSize: 42, fontWeight: "700", color: theme.textPrimary, marginTop: 4 },
  pnlRow: { marginTop: 8 },
  pnl: { fontSize: 17, fontWeight: "500" },
  chartWrap: { marginTop: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  statWrap: { width: "47%" },
  statTile: { marginBottom: 0, padding: 14 },
  statLabel: { color: theme.textSecondary, fontSize: 11 },
  statValue: { color: theme.textPrimary, fontSize: 20, fontWeight: "700", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  actionBtn: { flex: 1 },
  msg: { color: theme.success, textAlign: "center", marginTop: 10, fontSize: 13 },
  mover: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  moverSym: { fontWeight: "700", color: theme.textPrimary, fontSize: 16, flex: 1 },
  moverPrice: { color: theme.textPrimary, marginRight: 12 },
  allocRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  allocLabel: { width: 52, color: theme.textSecondary, fontSize: 12 },
  allocBarBg: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3 },
  allocBar: { height: 6, borderRadius: 3 },
  allocPct: { width: 40, textAlign: "right", color: theme.textSecondary, fontSize: 12 },
  tradeCard: { marginBottom: 8, padding: 12 },
  tradeRow: { flexDirection: "row", justifyContent: "space-between" },
  tradeSym: { fontWeight: "600", color: theme.textPrimary },
  tradeAmt: { color: theme.textPrimary },
  muted: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
});
