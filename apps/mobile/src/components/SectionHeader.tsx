import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 8 },
  flex: { flex: 1 },
  title: { fontSize: 18, fontWeight: "600", color: theme.textPrimary },
  sub: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  actionText: { color: theme.success, fontSize: 13, fontWeight: "600" },
});
