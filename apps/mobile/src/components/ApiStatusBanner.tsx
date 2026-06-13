import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { fetchApiHealth } from "@/src/lib/api-health";
import { API_URL } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export function ApiStatusBanner() {
  const [issue, setIssue] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const check = useCallback(async () => {
    const h = await fetchApiHealth();
    if (!h.ready) {
      setIssue(
        h.message ??
          `Can't reach API at ${API_URL}. Check connection and try again.`
      );
    } else {
      setIssue(null);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [check]);

  async function onRetry() {
    setRetrying(true);
    await check();
    setRetrying(false);
  }

  if (!issue) return null;

  return (
    <Pressable style={styles.banner} onPress={onRetry}>
      <View style={styles.row}>
        <Text style={styles.title}>Connection issue</Text>
        {retrying ? <ActivityIndicator size="small" color={theme.loss} /> : null}
      </View>
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.loss, fontWeight: "700", fontSize: 13 },
  text: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  hint: { color: theme.textSecondary, fontSize: 10, marginTop: 6 },
});
