import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { theme } from "@/src/lib/theme";
import { useAppAuth } from "@/src/hooks/useAuth";

export default function SplashRoute() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const [done, setDone] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => setDone(true), 1500);
    return () => clearTimeout(t);
  }, [opacity]);

  if (!isLoaded || !done) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.logo, { opacity }]}>
          <Text style={styles.logoText}>A</Text>
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity }]}>Auxano</Animated.Text>
        <Text style={styles.sub}>Grow intelligently</Text>
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/(tabs)/dashboard" />;
  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: { fontSize: 36, fontWeight: "700", color: theme.textPrimary },
  title: { fontSize: 36, fontWeight: "600", color: theme.textPrimary },
  sub: { marginTop: 8, color: theme.textSecondary, fontSize: 16 },
});
