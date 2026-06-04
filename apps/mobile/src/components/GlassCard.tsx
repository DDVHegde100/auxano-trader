import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "@/src/lib/theme";

export function GlassCard({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
}) {
  return (
    <View style={[styles.card, glow && styles.glow, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 12,
  },
  glow: {
    shadowColor: "#C7C7C7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
});
