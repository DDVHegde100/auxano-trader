import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { theme } from "@/src/lib/theme";
import { useAppAuth, isDevAuthMode } from "@/src/hooks/useAuth";
import { DEV_TEST_EMAIL, DEV_TEST_PASSWORD } from "@auxano/shared";

export default function SignInScreen() {
  const router = useRouter();
  const auth = useAppAuth();
  const [email, setEmail] = useState(DEV_TEST_EMAIL);
  const [password, setPassword] = useState(DEV_TEST_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSignIn() {
    setLoading(true);
    setError("");
    try {
      if (isDevAuthMode) {
        await auth.signIn(email, password);
        router.replace("/(tabs)/dashboard");
        return;
      }
      setError("Clerk mode: configure EXPO_PUBLIC_USE_DEV_AUTH=true for test login");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>A</Text>
        </View>
        <Text style={styles.title}>Welcome to Auxano</Text>
        <Text style={styles.sub}>
          {isDevAuthMode
            ? "Test login (no Clerk setup required)"
            : "Sign in to continue"}
        </Text>

        {isDevAuthMode ? (
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEV · test@gmail.com prefilled</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primaryBtn} onPress={onSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.primaryText}>Sign in</Text>
          )}
        </Pressable>

        {isDevAuthMode ? (
          <Text style={styles.hint}>
            Password: Test1234! · $100k paper balance on first login
          </Text>
        ) : (
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.linkBtn}>
              <Text style={styles.linkText}>Create account</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
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
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  logoText: { fontSize: 24, fontWeight: "700", color: theme.textPrimary },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.textPrimary,
    textAlign: "center",
  },
  sub: {
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  devBadge: {
    backgroundColor: "rgba(0,200,83,0.12)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  devBadgeText: { color: theme.success, textAlign: "center", fontSize: 12 },
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
    marginTop: 8,
  },
  primaryText: { color: theme.background, fontWeight: "600", fontSize: 16 },
  linkBtn: { marginTop: 16, alignItems: "center" },
  linkText: { color: theme.textSecondary },
  hint: { color: theme.textSecondary, fontSize: 12, textAlign: "center", marginTop: 16 },
  error: { color: theme.loss, marginBottom: 8, fontSize: 13 },
});
