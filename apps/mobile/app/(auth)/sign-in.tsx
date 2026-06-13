import { useSignIn } from "@clerk/clerk-expo";
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
import { OAuthButtons } from "@/src/components/OAuthButtons";
import { BrandLogo } from "@/src/components/BrandLogo";

export default function SignInScreen() {
  const router = useRouter();
  const auth = useAppAuth();
  const clerkSignIn = useSignIn();
  const [email, setEmail] = useState(isDevAuthMode ? DEV_TEST_EMAIL : "");
  const [password, setPassword] = useState(isDevAuthMode ? DEV_TEST_PASSWORD : "");
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
      if (!clerkSignIn.isLoaded) return;
      const attempt = await clerkSignIn.signIn.create({
        identifier: email.trim(),
        password,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await clerkSignIn.setActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)/dashboard");
        return;
      }
      setError("Additional verification required. Check your email.");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "errors" in e
          ? (e as { errors: { message: string }[] }).errors?.[0]?.message
          : e instanceof Error
            ? e.message
            : "Sign in failed";
      setError(msg ?? "Sign in failed");
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
        <BrandLogo size="md" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Welcome to Auxano</Text>
        <Text style={styles.sub}>
          {isDevAuthMode
            ? "Test login (no Clerk setup required)"
            : "Sign in to your paper account"}
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

        {!isDevAuthMode ? (
          <>
            <Text style={styles.or}>or continue with</Text>
            <OAuthButtons onError={setError} />
            <Link href="/(auth)/sign-up" asChild>
              <Pressable style={styles.linkBtn}>
                <Text style={styles.linkText}>Create account</Text>
              </Pressable>
            </Link>
          </>
        ) : (
          <Text style={styles.hint}>
            Password: Test1234! · $100k paper balance on first login
          </Text>
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
    backgroundColor: "rgba(188,138,95,0.12)",
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
  or: {
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: 16,
    fontSize: 12,
  },
  linkBtn: { marginTop: 16, alignItems: "center" },
  linkText: { color: theme.textSecondary },
  hint: { color: theme.textSecondary, fontSize: 12, textAlign: "center", marginTop: 16 },
  error: { color: theme.loss, marginBottom: 8, fontSize: 13 },
});
