import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { theme } from "@/src/lib/theme";

WebBrowser.maybeCompleteAuthSession();

type OAuthStrategy = "oauth_apple" | "oauth_google";

export function OAuthButtons({
  onError,
}: {
  onError: (msg: string) => void;
}) {
  const apple = useOAuth({ strategy: "oauth_apple" });
  const google = useOAuth({ strategy: "oauth_google" });
  const [busy, setBusy] = useState<OAuthStrategy | null>(null);

  const run = useCallback(
    async (strategy: OAuthStrategy) => {
      const hook = strategy === "oauth_apple" ? apple : google;
      setBusy(strategy);
      onError("");
      try {
        const { createdSessionId, setActive } = await hook.startOAuthFlow();
        if (createdSessionId) {
          await setActive!({ session: createdSessionId });
        }
      } catch (e: unknown) {
        onError(e instanceof Error ? e.message : "Sign in failed");
      } finally {
        setBusy(null);
      }
    },
    [apple, google, onError]
  );

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.btn}
        onPress={() => run("oauth_apple")}
        disabled={!!busy}
      >
        {busy === "oauth_apple" ? (
          <ActivityIndicator color={theme.textPrimary} />
        ) : (
          <Text style={styles.btnText}> Apple</Text>
        )}
      </Pressable>
      <Pressable
        style={styles.btn}
        onPress={() => run("oauth_google")}
        disabled={!!busy}
      >
        {busy === "oauth_google" ? (
          <ActivityIndicator color={theme.textPrimary} />
        ) : (
          <Text style={styles.btnText}> Google</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  btnText: { color: theme.textPrimary, fontWeight: "600" },
});
