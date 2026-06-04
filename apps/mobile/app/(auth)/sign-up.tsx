import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { theme } from "@/src/lib/theme";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.push("/onboarding");
    } catch {
      /* handle */
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Join Auxano</Text>
        <Text style={styles.sub}>$100,000 virtual capital awaits</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.primaryBtn} onPress={onSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.primaryText}>Create account</Text>
          )}
        </Pressable>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account?</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.textPrimary,
    textAlign: "center",
  },
  sub: { color: theme.textSecondary, textAlign: "center", marginBottom: 24 },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: theme.textPrimary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  primaryText: { color: theme.background, fontWeight: "600" },
  linkBtn: { marginTop: 16, alignItems: "center" },
  linkText: { color: theme.textSecondary },
});
