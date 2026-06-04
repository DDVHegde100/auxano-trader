import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";

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
    score >= 85 ? theme.success : score >= 70 ? "#4FC3F7" : score >= 55 ? "#FFB74D" : theme.textSecondary;

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
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  score: { fontWeight: "700" },
  grade: { fontSize: 9, color: theme.textSecondary, marginTop: 2, textTransform: "uppercase" },
});
