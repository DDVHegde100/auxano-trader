import { useAppAuth } from "@/src/hooks/useAuth";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StockRow } from "@/src/components/StockRow";
import { MiniChart } from "@/src/components/MiniChart";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatUsd, formatPct, formatTime } from "@/src/lib/format";
import { usePolling } from "@/src/hooks/usePolling";

interface QuoteDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  updatedAt: string;
  intraday: { time: string; price: number }[];
}

interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

export default function TradeScreen() {
  const { getToken } = useAppAuth();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [symbol, setSymbol] = useState(params.symbol ?? "AAPL");
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [qty, setQty] = useState("1");
  const [maxShares, setMaxShares] = useState(0);
  const [cash, setCash] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const loadQuotes = useCallback(async () => {
    const live = await apiFetch<{ quotes: LiveQuote[]; refreshedAt: string }>(
      "/api/market/live"
    );
    setQuotes(live.quotes ?? []);
  }, []);

  const loadDetail = useCallback(async () => {
    const token = await getToken();
    const d = await apiFetch<QuoteDetail>(`/api/market/${symbol}`);
    setDetail(d);
    try {
      const max = await apiFetch<{
        maxShares: number;
        cashBalance: number;
      }>(`/api/trading/max-buy?symbol=${symbol}`, { token: token ?? undefined });
      setMaxShares(max.maxShares);
      setCash(max.cashBalance);
    } catch {
      setMaxShares(0);
    }
  }, [symbol, getToken]);

  const loadWatchlist = useCallback(async () => {
    const token = await getToken();
    try {
      const w = await apiFetch<{
        watchlists: { items: { symbol: string }[] }[];
      }>("/api/watchlist", { token: token ?? undefined });
      setWatchlist(
        w.watchlists?.flatMap((l) => l.items.map((i) => i.symbol)) ?? []
      );
    } catch {
      setWatchlist([]);
    }
  }, [getToken]);

  useEffect(() => {
    loadQuotes();
    loadDetail();
    loadWatchlist();
  }, [loadQuotes, loadDetail, loadWatchlist]);

  useEffect(() => {
    if (params.symbol) setSymbol(params.symbol);
  }, [params.symbol]);

  usePolling(() => {
    loadQuotes();
    loadDetail();
  }, 5000);

  async function order(side: "BUY" | "SELL") {
    setBusy(true);
    setMsg("");
    const token = await getToken();
    const quantity = Number(qty);
    if (!quantity || quantity < 1) {
      setMsg("Enter a valid quantity");
      setBusy(false);
      return;
    }
    try {
      const res = await apiFetch<{ price: number; realizedPnl?: number }>(
        "/api/trading/order",
        {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify({ symbol, side, quantity }),
        }
      );
      const extra =
        side === "SELL" && res.realizedPnl
          ? ` · Realized ${formatUsd(res.realizedPnl)}`
          : "";
      setMsg(`${side} filled @ ${formatUsd(res.price)}${extra}`);
      await loadDetail();
      const max = await apiFetch<{ maxShares: number; cashBalance: number }>(
        `/api/trading/max-buy?symbol=${symbol}`,
        { token: token ?? undefined }
      );
      setMaxShares(max.maxShares);
      setCash(max.cashBalance);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  }

  async function sellAll() {
    Alert.alert("Sell all shares?", `Close entire ${symbol} position?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sell all",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          const token = await getToken();
          try {
            await apiFetch("/api/trading/sell-all", {
              method: "POST",
              token: token ?? undefined,
              body: JSON.stringify({ symbol }),
            });
            setMsg(`Sold all ${symbol}`);
            await loadDetail();
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "Failed");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  async function addWatchlist() {
    const token = await getToken();
    await apiFetch("/api/watchlist", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ symbol }),
    });
    setMsg(`Added ${symbol} to watchlist`);
    loadWatchlist();
  }

  function setMaxBuy() {
    if (maxShares > 0) setQty(String(maxShares));
  }

  const spark = detail?.intraday?.map((b) => b.price) ?? [];
  const inWatchlist = watchlist.includes(symbol);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Paper Trade</Text>
        <Text style={styles.sub}>
          Live simulated prices · Buying power {formatUsd(cash)}
        </Text>

        <GlassCard glow>
          {detail ? (
            <>
              <View style={styles.detailHead}>
                <View>
                  <Text style={styles.sym}>{detail.symbol}</Text>
                  <Text style={styles.name}>{detail.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.price}>{formatUsd(detail.price)}</Text>
                  <Text
                    style={{
                      color: detail.changePct >= 0 ? theme.success : theme.loss,
                    }}
                  >
                    {formatPct(detail.changePct)} ({formatUsd(detail.change)})
                  </Text>
                  <Text style={styles.ts}>Live · {formatTime(detail.updatedAt)}</Text>
                </View>
              </View>
              {spark.length > 2 ? (
                <MiniChart
                  data={spark}
                  height={120}
                  positive={detail.changePct >= 0}
                />
              ) : null}
              <View style={styles.bidAsk}>
                <Text style={styles.muted}>Bid {formatUsd(detail.bid)}</Text>
                <Text style={styles.muted}>Ask {formatUsd(detail.ask)}</Text>
              </View>
            </>
          ) : (
            <ActivityIndicator color={theme.success} />
          )}
        </GlassCard>

        <SectionHeader title="Watchlist & symbols" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {quotes.map((q) => (
            <Pressable
              key={q.symbol}
              style={[styles.chip, symbol === q.symbol && styles.chipOn]}
              onPress={() => setSymbol(q.symbol)}
            >
              <Text style={symbol === q.symbol ? styles.chipOnText : styles.chipText}>
                {q.symbol}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {quotes.slice(0, 6).map((q) => (
          <StockRow
            key={q.symbol}
            quote={{ ...q, sparkline: undefined }}
            selected={symbol === q.symbol}
            onPress={() => setSymbol(q.symbol)}
          />
        ))}

        <GlassCard>
          <SectionHeader title="Place order" subtitle={`Max buy: ${maxShares} shares`} />
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={() => setQty(String(Math.max(1, Number(qty) - 1)))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
            />
            <Pressable style={styles.qtyBtn} onPress={() => setQty(String(Number(qty) + 1))}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.quickQty}>
            {["1", "5", "10", "25"].map((n) => (
              <Pressable key={n} style={styles.quickChip} onPress={() => setQty(n)}>
                <Text style={styles.quickChipText}>{n}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.quickChip} onPress={setMaxBuy}>
              <Text style={[styles.quickChipText, { color: theme.success }]}>Max</Text>
            </Pressable>
          </View>
          <Text style={styles.est}>
            Est. {formatUsd((detail?.price ?? 0) * Number(qty || 0))}
          </Text>
          <View style={styles.btns}>
            <PrimaryButton
              label="Buy"
              onPress={() => order("BUY")}
              variant="success"
              loading={busy}
              style={styles.half}
            />
            <PrimaryButton
              label="Sell"
              onPress={() => order("SELL")}
              variant="danger"
              loading={busy}
              style={styles.half}
            />
          </View>
          <PrimaryButton label="Sell all shares" onPress={sellAll} variant="ghost" />
          <PrimaryButton
            label={inWatchlist ? "On watchlist ✓" : "Add to watchlist"}
            onPress={addWatchlist}
            variant="ghost"
            disabled={inWatchlist}
          />
          {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginBottom: 16 },
  detailHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sym: { fontSize: 26, fontWeight: "700", color: theme.textPrimary },
  name: { color: theme.textSecondary, fontSize: 14 },
  price: { fontSize: 28, fontWeight: "700", color: theme.textPrimary },
  ts: { fontSize: 10, color: theme.textSecondary, marginTop: 4 },
  bidAsk: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  muted: { color: theme.textSecondary, fontSize: 13 },
  chips: { marginBottom: 12, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  chipOn: { backgroundColor: "rgba(0,200,83,0.15)", borderColor: theme.success },
  chipText: { color: theme.textSecondary },
  chipOnText: { color: theme.success, fontWeight: "700" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { color: theme.textPrimary, fontSize: 22 },
  input: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
  },
  quickQty: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickChipText: { color: theme.textSecondary },
  est: { color: theme.textSecondary, textAlign: "center", marginVertical: 12 },
  btns: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  msg: { textAlign: "center", color: theme.textSecondary, marginTop: 12, fontSize: 13 },
});
