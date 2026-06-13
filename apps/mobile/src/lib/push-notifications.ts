import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiFetch } from "@/src/lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(
  getToken: () => Promise<string | null>
): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Auxano",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#bc8a5f",
    });
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    process.env.EAS_PROJECT_ID;

  const pushToken = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  const authToken = await getToken();
  if (authToken && pushToken.data) {
    await apiFetch("/api/notifications/push-token", {
      method: "POST",
      token: authToken,
      body: JSON.stringify({
        expoPushToken: pushToken.data,
        pushEnabled: true,
      }),
    });
    await apiFetch("/api/notifications/preferences", {
      method: "PATCH",
      token: authToken,
      body: JSON.stringify({
        pushEnabled: true,
        notifyAutopilot: true,
        notifyTrading: true,
      }),
    });
  }

  return pushToken.data;
}
