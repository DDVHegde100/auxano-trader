import { View, Text, Pressable, StyleSheet } from "react-native";
import { pageHeader } from "@/src/styles/components";
import { colors, fontFamily } from "@/src/styles/design-system";

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
    <View style={pageHeader.wrap}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={pageHeader.title}>{title}</Text>
          {subtitle ? <Text style={pageHeader.subtitle}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  flex: { flex: 1 },
  action: {
    fontFamily,
    fontSize: 13,
    color: colors.accent,
  },
});
