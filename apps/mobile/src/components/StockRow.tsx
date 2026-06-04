import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";
import { formatUsd, formatPct } from "@/src/lib/format";
import { MiniChart } from "./MiniChart";

export interface StockQuoteRow {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  sparkline?: number[];
}

export function StockRow({
  quote,
  selected,
  onPress,
  showChart,
}: {
  quote: StockQuoteRow;
  selected?: boolean;
  onPress: () => void;
  showChart?: boolean;
}) {
  const up = quote.changePct >= 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.selected]}
    >
      <View style={styles.left}>
        <Text style={styles.sym}>{quote.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{quote.name}</Text>
      </View>
      {showChart && quote.sparkline ? (
        <View style={styles.chart}>
          <MiniChart data={quote.sparkline} height={36} positive={up} />
        </View>
      ) : null}
      <View style={styles.right}>
        <Text style={styles.price}>{formatUsd(quote.price)}</Text>
        <Text style={[styles.chg, { color: up ? theme.success : theme.loss }]}>
          {formatPct(quote.changePct)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selected: {
    borderColor: "rgba(0,200,83,0.35)",
    backgroundColor: "rgba(0,200,83,0.08)",
  },
  left: { width: 72 },
  sym: { fontWeight: "700", color: theme.textPrimary, fontSize: 15 },
  name: { fontSize: 11, color: theme.textSecondary, maxWidth: 72 },
  chart: { flex: 1, marginHorizontal: 8 },
  right: { alignItems: "flex-end", minWidth: 80 },
  price: { color: theme.textPrimary, fontWeight: "600", fontSize: 14 },
  chg: { fontSize: 12, marginTop: 2 },
});
