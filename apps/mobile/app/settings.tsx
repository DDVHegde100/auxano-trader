import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useUser } from "@clerk/clerk-expo";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { useAppAuth, isDevAuthMode } from "@/src/hooks/useAuth";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";
import { AuthLoadingScreen } from "@/src/components/AuthLoadingScreen";
import { DEV_TEST_EMAIL } from "@auxano/shared";

function useClerkUserSafe() {
  if (isDevAuthMode) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user } = useUser();
  return user;
}

type ProfileUser = {
  email?: string;
  name?: string | null;
  username?: string | null;
};

export default function SettingsScreen() {
  const router = useRouter();
  const authed = useRequireAuth();
  const { signOut, getToken } = useAppAuth();
  const clerkUser = useClerkUserSafe();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<{ user?: ProfileUser }>("/api/user/profile", {
        token: token ?? undefined,
      });
      setProfile(data.user ?? null);
    } catch {
      setProfile(null);
    }
  }, [getToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function onRefresh() {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  const email =
    profile?.email ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    (isDevAuthMode ? DEV_TEST_EMAIL : "—");
  const displayName =
    profile?.name ?? clerkUser?.fullName ?? profile?.username ?? "Account";
  const username = profile?.username ? `@${profile.username}` : null;
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  if (!authed) return <AuthLoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.success} />
        }
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.sub}>Account, security, and legal</Text>

        <SectionHeader title="Account" />
        <GlassCard>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{displayName}</Text>
          {username ? (
            <>
              <Text style={[styles.label, styles.spaced]}>Username</Text>
              <Text style={styles.value}>{username}</Text>
            </>
          ) : null}
          <Text style={[styles.label, styles.spaced]}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </GlassCard>

        <SectionHeader title="Security" />
        {!isDevAuthMode ? (
          <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
            <GlassCard style={styles.linkRow}>
              <Text style={styles.linkTitle}>Reset password</Text>
              <Text style={styles.linkArrow}>→</Text>
            </GlassCard>
          </Pressable>
        ) : (
          <GlassCard>
            <Text style={styles.hint}>
              Dev mode uses test credentials. Use production build for password reset.
            </Text>
          </GlassCard>
        )}

        <SectionHeader title="Notifications" />
        <Pressable onPress={() => router.push("/notifications")}>
          <GlassCard style={styles.linkRow}>
            <Text style={styles.linkTitle}>Notification preferences</Text>
            <Text style={styles.linkArrow}>→</Text>
          </GlassCard>
        </Pressable>

        <SectionHeader title="Legal" />
        <Pressable onPress={() => router.push("/legal/privacy")}>
          <GlassCard style={styles.linkRow}>
            <Text style={styles.linkTitle}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>→</Text>
          </GlassCard>
        </Pressable>
        <Pressable onPress={() => router.push("/legal/terms")}>
          <GlassCard style={styles.linkRow}>
            <Text style={styles.linkTitle}>Terms of Service</Text>
            <Text style={styles.linkArrow}>→</Text>
          </GlassCard>
        </Pressable>

        <GlassCard style={{ marginTop: 8 }}>
          <Text style={styles.disclaimer}>
            Paper trading only · simulated quotes · not financial advice
          </Text>
        </GlassCard>

        <SectionHeader title="About" />
        <GlassCard>
          <Text style={styles.label}>App version</Text>
          <Text style={styles.value}>{appVersion}</Text>
        </GlassCard>

        <PrimaryButton label="Sign out" onPress={handleSignOut} variant="danger" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { color: theme.accent, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "600", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginBottom: 20, marginTop: 4 },
  label: { color: theme.textSecondary, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  spaced: { marginTop: 14 },
  value: { color: theme.textPrimary, fontSize: 16, marginTop: 4, fontWeight: "500" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  linkTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: "500" },
  linkArrow: { color: theme.accent, fontSize: 18 },
  hint: { color: theme.textSecondary, fontSize: 13, lineHeight: 20 },
  disclaimer: { color: theme.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
