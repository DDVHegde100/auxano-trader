import { Linking, Pressable, Text, View, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";

const WEB = "https://auxano-red.vercel.app";

export function LegalFooter() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        Paper trading only · simulated quotes · not financial advice.
      </Text>
      <View style={styles.links}>
        <Pressable onPress={() => Linking.openURL(`${WEB}/privacy`)}>
          <Text style={styles.link}>Privacy</Text>
        </Pressable>
        <Text style={styles.dot}> · </Text>
        <Pressable onPress={() => Linking.openURL(`${WEB}/terms`)}>
          <Text style={styles.link}>Terms</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, alignItems: "center", gap: 8 },
  text: { color: theme.textSecondary, fontSize: 11, textAlign: "center", lineHeight: 18 },
  links: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  link: { color: theme.accent, fontSize: 12, fontWeight: "600" },
  dot: { color: theme.textSecondary, fontSize: 12 },
});
