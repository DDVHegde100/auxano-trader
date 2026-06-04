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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { MiniChart } from "@/src/components/MiniChart";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatUsd, formatPct } from "@/src/lib/format";
import type { PositionView, PortfolioSummary } from "@auxano/shared";

export default function PortfolioScreen() {
  const { getToken } = useAppAuth();
  const router = useRouter();
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState("");
  const [selling, setSelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    const d = await apiFetch<{
      positions: PositionView[];
      summary: PortfolioSummary;
    }>("/api/portfolio/positions", { token: token ?? undefined });
    setPositions(d.positions ?? []);
    setSummary(d.summary ?? null);
  }, [getToken]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function sellPosition(symbol: string, qty: number) {
    setSelling(symbol);
    const token = await getToken();
    try {
      await apiFetch("/api/trading/order", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ symbol, side: "SELL", quantity: qty }),
      });
      setMsg(`Sold ${qty} ${symbol}`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sell failed");
    } finally {
      setSelling(null);
    }
  }

  async function sellAllPositions() {
    Alert.alert("Sell everything?", "Close all open positions at market.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sell all",
        style: "destructive",
        onPress: async () => {
          const token = await getToken();
          try {
            await apiFetch("/api/trading/sell-all", {
              method: "POST",
              token: token ?? undefined,
              body: JSON.stringify({}),
            });
            setMsg("All positions closed");
            await load();
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "Failed");
          }
        },
      },
    ]);
  }

  const chartData = positions.map((p) => p.marketValue);
  const totalUnrealized = summary?.unrealizedPnl ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.success} />
        }
      >
        <Text style={styles.title}>Portfolio</Text>
        {summary && (
          <GlassCard glow>
            <Text style={styles.total}>{formatUsd(summary.portfolioValue)}</Text>
            <Text style={styles.subLabel}>Total portfolio value</Text>
            <View style={styles.summaryRow}>
              <SummaryChip
                label="Cash"
                value={formatUsd(summary.cashBalance, true)}
              />
              <SummaryChip
                label="Invested"
                value={formatUsd(summary.positionsValue, true)}
              />
              <SummaryChip
                label="Return"
                value={formatPct(summary.totalReturnPct)}
                positive={summary.totalReturnPct >= 0}
              />
            </View>
            <Text
              style={[
                styles.unreal,
                { color: totalUnrealized >= 0 ? theme.success : theme.loss },
              ]}
            >
              Unrealized {formatUsd(totalUnrealized)} · Realized{" "}
              {formatUsd(summary.realizedPnl)}
            </Text>
            {chartData.length > 0 ? (
              <View style={styles.chart}>
                <MiniChart data={chartData} height={64} positive={totalUnrealized >= 0} />
              </View>
            ) : null}
          </GlassCard>
        )}

        <SectionHeader
          title="Positions"
          subtitle={`${positions.length} holdings`}
          actionLabel="Trade"
          onAction={() => router.push("/(tabs)/trade")}
        />

        {positions.length > 0 ? (
          <PrimaryButton
            label="Sell all positions"
            onPress={sellAllPositions}
            variant="danger"
          />
        ) : null}

        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        {loading ? (
          <ActivityIndicator color={theme.success} />
        ) : positions.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>
              No open positions. Your $100,000 paper cash is ready in Trade.
            </Text>
            <PrimaryButton
              label="Start trading"
              onPress={() => router.push("/(tabs)/trade")}
              variant="success"
            />
          </GlassCard>
        ) : (
          positions.map((p) => (
            <GlassCard key={p.symbol}>
              <View style={styles.posHead}>
                <View>
                  <Text style={styles.sym}>{p.symbol}</Text>
                  <Text style={styles.name}>{p.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.val}>{formatUsd(p.marketValue)}</Text>
                  <Text
                    style={{
                      color: p.unrealizedPnl >= 0 ? theme.success : theme.loss,
                      fontWeight: "600",
                    }}
                  >
                    {formatUsd(p.unrealizedPnl)} ({formatPct(p.unrealizedPnlPct)})
                  </Text>
                </View>
              </View>
              <View style={styles.details}>
                <Detail label="Shares" value={String(p.quantity)} />
                <Detail label="Avg cost" value={formatUsd(p.averageCost)} />
                <Detail label="Last" value={formatUsd(p.currentPrice)} />
                <Detail label="Weight" value={`${p.weight.toFixed(1)}%`} />
              </View>
              <View style={styles.posActions}>
                <PrimaryButton
                  label={selling === p.symbol ? "Selling…" : "Sell all"}
                  onPress={() => sellPosition(p.symbol, p.quantity)}
                  variant="danger"
                  loading={selling === p.symbol}
                  style={styles.posBtn}
                />
                <PrimaryButton
                  label="Trade"
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/trade",
                      params: { symbol: p.symbol },
                    })
                  }
                  variant="ghost"
                  style={styles.posBtn}
                />
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryChip({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text
        style={[
          styles.chipVal,
          positive !== undefined && {
            color: positive ? theme.success : theme.loss,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary, marginBottom: 16 },
  total: { fontSize: 36, fontWeight: "700", color: theme.textPrimary },
  subLabel: { color: theme.textSecondary, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  chip: { alignItems: "center", flex: 1 },
  chipLabel: { fontSize: 11, color: theme.textSecondary },
  chipVal: { fontSize: 15, fontWeight: "600", color: theme.textPrimary, marginTop: 4 },
  unreal: { marginTop: 16, fontSize: 14 },
  chart: { marginTop: 16 },
  empty: { color: theme.textSecondary, marginBottom: 16, lineHeight: 22 },
  msg: { color: theme.success, textAlign: "center", marginVertical: 12 },
  posHead: { flexDirection: "row", justifyContent: "space-between" },
  sym: { fontSize: 20, fontWeight: "700", color: theme.textPrimary },
  name: { color: theme.textSecondary, fontSize: 13 },
  val: { fontSize: 18, fontWeight: "600", color: theme.textPrimary },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 12,
  },
  detail: { width: "45%" },
  detailLabel: { fontSize: 11, color: theme.textSecondary },
  detailVal: { color: theme.textPrimary, fontWeight: "500", marginTop: 2 },
  posActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  posBtn: { flex: 1, marginBottom: 0 },
});
