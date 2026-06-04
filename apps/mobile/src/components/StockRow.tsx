import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, fontFamily, movementColor } from "@/src/styles/design-system";
import { formatUsd, formatPct } from "@/src/lib/format";

export function StockRow({
  symbol,
  name,
  price,
  changePct,
  onPress,
  selected,
}: {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  onPress?: () => void;
  selected?: boolean;
}) {
  const up = changePct >= 0;
  const content = (
    <View style={[styles.row, selected && styles.selected]}>
      <View>
        <Text style={styles.sym}>{symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{formatUsd(price)}</Text>
        <Text style={[styles.chg, { color: movementColor(changePct) }]}>
          {formatPct(changePct)}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 237, 216, 0.06)",
  },
  selected: {
    backgroundColor: colors.accentMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  pressed: { opacity: 0.85 },
  sym: {
    fontFamily,
    fontSize: 16,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  name: {
    fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 160,
    marginTop: 2,
  },
  right: { alignItems: "flex-end" },
  price: {
    fontFamily,
    fontSize: 15,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  chg: {
    fontFamily,
    fontSize: 12,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
});
