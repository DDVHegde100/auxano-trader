import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Share, Linking, Alert } from "react-native";
import { theme } from "@/src/lib/theme";
import { API_URL } from "@/src/lib/api";

type SharePayload = {
  publicUrl: string;
  imageUrl: string;
  message: string;
};

export function ShareSheet({
  username,
  period = "week",
}: {
  username: string;
  period?: "week" | "30d";
}) {
  const [loading, setLoading] = useState(false);

  async function loadCard(): Promise<SharePayload | null> {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/share/${encodeURIComponent(username)}?period=${period}`
      );
      const data = await res.json();
      if (!data.visible) {
        Alert.alert(
          "Private profile",
          "Turn on public profile in the web app to share your performance card."
        );
        return null;
      }
      return {
        publicUrl: data.publicUrl,
        imageUrl: data.imageUrl,
        message: `${data.displayName}'s ${data.periodLabel} return: ${data.returnPct >= 0 ? "+" : ""}${data.returnPct.toFixed(2)}% vs SPY on Auxano (paper)`,
      };
    } catch {
      Alert.alert("Error", "Could not load share card.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function shareNative() {
    const card = await loadCard();
    if (!card) return;
    await Share.share({
      message: `${card.message}\n${card.publicUrl}`,
      url: card.publicUrl,
      title: "Auxano performance",
    });
  }

  async function copyLink() {
    const card = await loadCard();
    if (!card) return;
    await Share.share({ message: card.publicUrl });
  }

  async function openPreview() {
    const card = await loadCard();
    if (!card) return;
    Linking.openURL(card.publicUrl);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Share performance</Text>
      <Text style={styles.sub}>
        Branded card with SPY comparison · @{username}/{period}
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.primary]}
          onPress={shareNative}
          disabled={loading}
        >
          <Text style={styles.primaryText}>{loading ? "…" : "Share"}</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={copyLink} disabled={loading}>
          <Text style={styles.btnText}>Copy link</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={openPreview} disabled={loading}>
          <Text style={styles.btnText}>Preview</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  title: { fontSize: 16, fontWeight: "600", color: theme.textPrimary },
  sub: { marginTop: 4, fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primary: { backgroundColor: theme.accent, borderColor: theme.accent },
  primaryText: { color: "#1a1209", fontWeight: "600" },
  btnText: { color: theme.textPrimary, fontSize: 14 },
});
