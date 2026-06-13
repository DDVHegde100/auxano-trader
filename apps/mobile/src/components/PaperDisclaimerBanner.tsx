import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";

export function PaperDisclaimerBanner({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.banner, compact && styles.compact]}>
      <Text style={styles.text}>
        Paper · simulated quotes · not real money or financial advice
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(188,138,95,0.35)",
    backgroundColor: "rgba(188,138,95,0.08)",
  },
  compact: { marginHorizontal: 0, marginBottom: 12 },
  text: {
    color: theme.textSecondary,
    fontSize: 11,
    textAlign: "center",
  },
});
