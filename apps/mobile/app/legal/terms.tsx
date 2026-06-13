import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/src/lib/theme";
import { BrandLogo } from "@/src/components/BrandLogo";

const API_BASE = "https://auxano-red.vercel.app";

export default function TermsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo size="sm" />
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: June 2026</Text>
        <Text style={styles.body}>
          Auxano provides simulated paper trading for education and entertainment. Nothing on
          Auxano constitutes financial, investment, or tax advice. Virtual balances and trades
          have no real-world value.
        </Text>
        <Text style={styles.body}>
          You must be 13+ to use the service. You are responsible for your account credentials.
          We may suspend accounts that abuse the platform or attempt to manipulate leaderboards.
        </Text>
        <Text style={styles.body}>
          The service is provided as-is. We do not guarantee quote accuracy or uptime.
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL(`${API_BASE}/terms`)}>
          Open full terms on web →
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 24 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary, marginTop: 16 },
  updated: { color: theme.textSecondary, marginBottom: 16, fontSize: 12 },
  body: { color: theme.textSecondary, lineHeight: 22, marginBottom: 14 },
  link: { color: theme.accent, marginTop: 8, fontWeight: "600" },
});
