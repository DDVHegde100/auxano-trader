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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { theme } from "@/src/lib/theme";
import { OAuthButtons } from "@/src/components/OAuthButtons";
import { BrandLogo } from "@/src/components/BrandLogo";
import { clerkErrorMessage, normalizeVerificationCode } from "@/src/lib/clerk-errors";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [error, setError] = useState("");

  async function onSignUp() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    setResendMsg("");
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    if (!isLoaded) return;
    const normalized = normalizeVerificationCode(code);
    if (normalized.length < 6) {
      setError("Enter the full 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: normalized,
      });

      const sessionId =
        result.createdSessionId ?? signUp.createdSessionId ?? null;

      if (result.status === "complete" && sessionId) {
        await setActive({ session: sessionId });
        router.replace("/onboarding");
        return;
      }

      if (sessionId) {
        await setActive({ session: sessionId });
        router.replace("/onboarding");
        return;
      }

      setError("Verification incomplete. Check the code or request a new one.");
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!isLoaded) return;
    setResendMsg("");
    setError("");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendMsg("New code sent — check your inbox and spam folder.");
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <BrandLogo size="md" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Join Auxano</Text>
        <Text style={styles.sub}>$100,000 virtual capital awaits</Text>

        {pendingVerification ? (
          <>
            <Text style={styles.verifyHint}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(normalizeVerificationCode(t))}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {resendMsg ? <Text style={styles.success}>{resendMsg}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={onVerify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryText}>Verify email</Text>
              )}
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={onResend} disabled={loading}>
              <Text style={styles.linkAccent}>Resend code</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => {
                setPendingVerification(false);
                setCode("");
                setError("");
              }}
            >
              <Text style={styles.linkText}>Use a different email</Text>
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
              textContentType="emailAddress"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (8+ characters)"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
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
  sub: { color: theme.textSecondary, textAlign: "center", marginBottom: 24 },
  verifyHint: {
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
  },
  emailHighlight: { color: theme.textPrimary, fontWeight: "600" },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "600",
  },
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
  linkBtn: { marginTop: 12, alignItems: "center" },
  linkText: { color: theme.textSecondary },
  linkAccent: { color: theme.accent, fontWeight: "600" },
  error: { color: theme.loss, marginBottom: 8, fontSize: 13, textAlign: "center" },
  success: { color: theme.success, marginBottom: 8, fontSize: 13, textAlign: "center" },
});
