import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { theme } from "@/src/lib/theme";
import { useAppAuth } from "@/src/hooks/useAuth";
import { BrandLogo } from "@/src/components/BrandLogo";
import { apiFetch } from "@/src/lib/api";
import { isDevAuthMode } from "@/src/hooks/useAuth";

export default function SplashRoute() {
  const { isLoaded, isSignedIn, getToken } = useAppAuth();
  const [done, setDone] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => setDone(true), 1200);
    return () => clearTimeout(t);
  }, [opacity]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isDevAuthMode) {
      if (isLoaded) setChecked(true);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<{ onboardingComplete?: boolean }>(
          "/api/user/onboarding",
          { token: token ?? undefined }
        );
        setNeedsOnboarding(!data.onboardingComplete);
      } catch {
        setNeedsOnboarding(false);
      } finally {
        setChecked(true);
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || !done || (isSignedIn && !isDevAuthMode && !checked)) {
    return (
      <View style={styles.container}>
        <Animated.View style={{ opacity }}>
          <BrandLogo size="lg" />
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity }]}>Auxano</Animated.Text>
        <Text style={styles.sub}>Grow intelligently</Text>
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (needsOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 36, fontWeight: "600", color: theme.textPrimary, marginTop: 24 },
  sub: { marginTop: 8, color: theme.textSecondary, fontSize: 16 },
});
