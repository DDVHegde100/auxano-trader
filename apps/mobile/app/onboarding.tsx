import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";

export default function OnboardingPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Complete onboarding in the web app, or extend this screen with the same
        flow as /onboarding on web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 24,
    justifyContent: "center",
  },
  text: { color: theme.textSecondary, textAlign: "center", lineHeight: 22 },
});
