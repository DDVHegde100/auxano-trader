import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { DevAuthProvider } from "@/src/context/DevAuthContext";
import { theme } from "@/src/lib/theme";

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
          contentStyle: { backgroundColor: theme.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="strategy/[slug]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (USE_DEV_AUTH) {
    return (
      <DevAuthProvider>
        <AppStack />
      </DevAuthProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AppStack />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
