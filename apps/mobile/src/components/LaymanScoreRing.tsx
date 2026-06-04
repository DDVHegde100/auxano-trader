import { View, Text, StyleSheet } from "react-native";
import { colors, fontFamily } from "@/src/styles/design-system";

export function LaymanScoreRing({
  score,
  grade,
  size = "md",
}: {
  score: number;
  grade?: string;
  size?: "sm" | "md" | "lg";
}) {
  const color =
    score >= 85
      ? colors.lightBronze
      : score >= 70
        ? colors.camel
        : score >= 55
          ? colors.fadedCopper
          : colors.textMuted;

  const dim = size === "lg" ? 88 : size === "md" ? 64 : 48;
  const fontSize = size === "lg" ? 28 : size === "md" ? 22 : 16;

  return (
    <View style={[styles.ring, { width: dim, height: dim, borderColor: color }]}>
      <Text style={[styles.score, { fontSize, color }]}>{score}</Text>
      {grade ? <Text style={styles.grade}>{grade}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 49, 1, 0.12)",
  },
  score: { fontFamily, fontWeight: "400" },
  grade: {
    fontFamily,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },
});
