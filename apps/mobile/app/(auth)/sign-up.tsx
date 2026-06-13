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
import { OAuthButtons } from "@/src/components/OAuthButtons";
import { BrandLogo } from "@/src/components/BrandLogo";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSignUp() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "errors" in e
          ? (e as { errors: { message: string }[] }).errors?.[0]?.message
          : e instanceof Error
            ? e.message
            : "Sign up failed";
      setError(msg ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/onboarding");
        return;
      }
      setError("Verification incomplete. Try again.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <BrandLogo size="md" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Join Auxano</Text>
        <Text style={styles.sub}>$100,000 virtual capital awaits</Text>

        {pendingVerification ? (
          <>
            <Text style={styles.verifyHint}>
              Enter the code sent to {email}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={onVerify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryText}>Verify email</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
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
              placeholder="Password (8+ characters)"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={onSignUp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryText}>Create account</Text>
              )}
            </Pressable>
            <Text style={styles.or}>or continue with</Text>
            <OAuthButtons onError={setError} />
          </>
        )}

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
  verifyHint: { color: theme.textSecondary, textAlign: "center", marginBottom: 12, fontSize: 13 },
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
  or: { color: theme.textSecondary, textAlign: "center", marginTop: 16, fontSize: 12 },
  linkBtn: { marginTop: 16, alignItems: "center" },
  linkText: { color: theme.textSecondary },
  error: { color: theme.loss, marginBottom: 8, fontSize: 13 },
});
