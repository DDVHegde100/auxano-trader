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
import { BrandLogo } from "@/src/components/BrandLogo";
import { clerkErrorMessage, normalizeVerificationCode } from "@/src/lib/clerk-errors";
import { LegalFooter } from "@/src/components/LegalFooter";

export default function SignInScreen() {
  const router = useRouter();
  const auth = useAppAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState(isDevAuthMode ? DEV_TEST_EMAIL : "");
  const [password, setPassword] = useState(isDevAuthMode ? DEV_TEST_PASSWORD : "");
  const [code, setCode] = useState("");
  const [pendingVerify, setPendingVerify] = useState(false);
  const [verifyMode, setVerifyMode] = useState<"first" | "second">("first");
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
      if (!isLoaded) return;

      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)/dashboard");
        return;
      }

      if (attempt.status === "needs_first_factor") {
        const emailFactor = attempt.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (emailFactor && "emailAddressId" in emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setVerifyMode("first");
          setPendingVerify(true);
          return;
        }
      }

      if (attempt.status === "needs_second_factor") {
        const emailFactor = attempt.supportedSecondFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (emailFactor && "emailAddressId" in emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setVerifyMode("second");
          setPendingVerify(true);
          return;
        }
      }

      setError("Sign in needs an extra step. Check your email or contact support.");
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function onVerifySignIn() {
    if (!isLoaded) return;
    const normalized = normalizeVerificationCode(code);
    if (normalized.length < 6) {
      setError("Enter the full 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result =
        verifyMode === "first"
          ? await signIn.attemptFirstFactor({
              strategy: "email_code",
              code: normalized,
            })
          : await signIn.attemptSecondFactor({
              strategy: "email_code",
              code: normalized,
            });

      const sessionId = result.createdSessionId ?? signIn.createdSessionId;
      if (result.status === "complete" && sessionId) {
        await setActive({ session: sessionId });
        router.replace("/(tabs)/dashboard");
        return;
      }

      setError("Verification failed. Try again or resend from sign up.");
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
        <Text style={styles.title}>Welcome to Auxano</Text>
        <Text style={styles.sub}>
          {pendingVerify
            ? "Verify your email to continue"
            : isDevAuthMode
              ? "Test login (no Clerk setup required)"
              : "Sign in to your paper account"}
        </Text>

        {isDevAuthMode ? (
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEV · test@gmail.com prefilled</Text>
          </View>
        ) : null}

        {pendingVerify ? (
          <>
            <Text style={styles.verifyHint}>
              Code sent to <Text style={styles.emailHighlight}>{email}</Text>
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
            <Pressable style={styles.primaryBtn} onPress={onVerifySignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryText}>Verify & sign in</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => {
                setPendingVerify(false);
                setCode("");
                setError("");
              }}
            >
              <Text style={styles.linkText}>Back to password sign in</Text>
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
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
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
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable style={styles.forgotBtn}>
                    <Text style={styles.linkAccent}>Forgot password?</Text>
                  </Pressable>
                </Link>
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
          </>
        )}
      </View>
      <LegalFooter />
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
  verifyHint: {
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 12,
    fontSize: 13,
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
    marginTop: 8,
  },
  primaryText: { color: theme.background, fontWeight: "600", fontSize: 16 },
  forgotBtn: { marginTop: 12, alignItems: "center" },
  linkBtn: { marginTop: 16, alignItems: "center" },
  linkText: { color: theme.textSecondary },
  linkAccent: { color: theme.accent, fontWeight: "600" },
  hint: { color: theme.textSecondary, fontSize: 12, textAlign: "center", marginTop: 16 },
  error: { color: theme.loss, marginBottom: 8, fontSize: 13, textAlign: "center" },
});
