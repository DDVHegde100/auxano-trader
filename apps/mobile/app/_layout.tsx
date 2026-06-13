import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { useFonts, Anaheim_400Regular } from "@expo-google-fonts/anaheim";
import { DevAuthProvider } from "@/src/context/DevAuthContext";
import { colors } from "@/src/styles/design-system";
import { registerForPushNotifications } from "@/src/lib/push-notifications";
import { useAuth } from "@clerk/clerk-expo";

SplashScreen.preventAutoHideAsync();

const USE_DEV_AUTH = process.env.EXPO_PUBLIC_USE_DEV_AUTH === "true";
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

function AppStack() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="strategy/[slug]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="compete" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
      </Stack>
    </>
  );
}

function PushRegistration() {
  const auth = useAuth();
  useEffect(() => {
    if (USE_DEV_AUTH) return;
    const t = setTimeout(() => {
      registerForPushNotifications(() => auth.getToken()).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [auth]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Anaheim_400Regular });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const content = USE_DEV_AUTH ? (
    <DevAuthProvider>
      <AppStack />
    </DevAuthProvider>
  ) : (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <PushRegistration />
        <AppStack />
      </ClerkLoaded>
    </ClerkProvider>
  );

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {content}
    </View>
  );
}
