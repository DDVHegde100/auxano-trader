import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/src/lib/theme";
import { BrandLogo } from "@/src/components/BrandLogo";

const API_BASE = "https://auxano-red.vercel.app";

export default function PrivacyPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo size="sm" />
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: June 2026</Text>
        <Text style={styles.body}>
          Auxano is a paper-trading simulator. We collect account information (email, display name)
          through Clerk for authentication, and usage data (trades, strategies, portfolio) to
          operate the service.
        </Text>
        <Text style={styles.body}>
          We do not sell personal data. Market quotes are simulated or delayed for educational
          purposes. Push notification tokens are stored only to deliver alerts you opt into.
        </Text>
        <Text style={styles.body}>
          Contact: support via the web app. Full policy also at {API_BASE}/privacy
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL(`${API_BASE}/privacy`)}>
          Open full policy on web →
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
