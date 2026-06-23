import { Tabs, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useEffect } from "react";
import { ApiStatusBanner } from "@/src/components/ApiStatusBanner";
import { colors, tabBar, fontFamily } from "@/src/styles/design-system";
import { useAppAuth } from "@/src/hooks/useAuth";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontFamily,
        color: focused ? colors.accent : colors.textMuted,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/(auth)/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ApiStatusBanner />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBar.bar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Algo",
          tabBarIcon: ({ focused }) => <TabIcon label="◆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: "Trade",
          tabBarIcon: ({ focused }) => <TabIcon label="▲" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bots"
        options={{
          title: "Bots",
          tabBarIcon: ({ focused }) => <TabIcon label="◇" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ focused }) => <TabIcon label="■" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => <TabIcon label="…" focused={focused} />,
        }}
      />
    </Tabs>
    </View>
  );
}
