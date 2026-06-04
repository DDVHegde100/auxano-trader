import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { fetchApiHealth } from "@/src/lib/api-health";
import { API_URL } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export function ApiStatusBanner() {
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => {
    fetchApiHealth().then((h) => {
      if (!h.ready) {
        setIssue(
          h.message ??
            `API not ready at ${API_URL}. Check Vercel deploy and EXPO_PUBLIC_API_URL.`
        );
      }
    });
  }, []);

  if (!issue) return null;

  return (
    <Pressable style={styles.banner} onPress={() => fetchApiHealth().then(() => setIssue(null))}>
      <Text style={styles.title}>API connection issue</Text>
      <Text style={styles.text}>{issue}</Text>
      <Text style={styles.hint}>Tap to retry · {API_URL}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.loss,
    backgroundColor: "rgba(180, 80, 60, 0.15)",
  },
  title: { color: theme.loss, fontWeight: "700", fontSize: 13 },
  text: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  hint: { color: theme.textSecondary, fontSize: 10, marginTop: 6 },
});
