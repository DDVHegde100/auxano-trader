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
import { BrandLogo } from "@/src/components/BrandLogo";
import { clerkErrorMessage, normalizeVerificationCode } from "@/src/lib/clerk-errors";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendResetCode() {
    if (!isLoaded) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your account email.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: trimmed,
      });
      setStep("reset");
      setInfo("Reset code sent — check inbox and spam.");
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (!isLoaded) return;
    setError("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setInfo("New reset code sent.");
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    }
  }

  async function resetPassword() {
    if (!isLoaded) return;
    const normalized = normalizeVerificationCode(code);
    if (normalized.length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const factor = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: normalized,
      });

      if (factor.status !== "needs_new_password") {
        setError("Invalid or expired code. Request a new one.");
        return;
      }

      const result = await signIn.resetPassword({ password });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        setStep("done");
        setTimeout(() => router.replace("/(tabs)/dashboard"), 1500);
        return;
      }

      setStep("done");
      setInfo("Password updated. Sign in with your new password.");
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
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
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          {step === "email"
            ? "We'll email you a code to reset your password."
            : step === "reset"
              ? `Enter the code sent to ${email}`
              : "You're all set."}
        </Text>

        {step === "email" && (
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={sendResetCode} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryText}>Send reset code</Text>
              )}
            </Pressable>
          </>
        )}

        {step === "reset" && (
          <>
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
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              textContentType="newPassword"
              value={confirm}
              onChangeText={setConfirm}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.success}>{info}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={resetPassword} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryText}>Update password</Text>
              )}
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={resendCode}>
              <Text style={styles.linkAccent}>Resend code</Text>
            </Pressable>
          </>
        )}

        {step === "done" && (
          <>
            {info ? <Text style={styles.success}>{info}</Text> : null}
            <Text style={styles.success}>Password reset complete.</Text>
          </>
        )}

        <Link href="/(auth)/sign-in" asChild>
          <Pressable style={styles.linkBtn}>
            <Text style={styles.linkText}>Back to sign in</Text>
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
  sub: {
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 20,
  },
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
  linkBtn: { marginTop: 16, alignItems: "center" },
  linkText: { color: theme.textSecondary },
  linkAccent: { color: theme.accent, fontWeight: "600" },
  error: { color: theme.loss, marginBottom: 8, fontSize: 13, textAlign: "center" },
  success: { color: theme.success, marginBottom: 8, fontSize: 13, textAlign: "center" },
});
