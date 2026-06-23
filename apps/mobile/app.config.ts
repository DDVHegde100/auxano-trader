import type { ExpoConfig, ConfigContext } from "expo/config";

const bundleId = "app.auxano.mobile";

export default (_ctx: ConfigContext): ExpoConfig => ({
  name: "Auxano",
  slug: "auxano",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "auxano",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#111111",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: "Auxano",
      NSUserTrackingUsageDescription:
        "Auxano does not track you across other apps. This permission is not used.",
      NSPhotoLibraryUsageDescription:
        "Auxano does not access your photo library.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#111111",
    },
    package: bundleId,
    versionCode: 1,
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#111111",
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#bc8a5f",
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  updates: {
    url: "https://u.expo.dev/67a39614-b3cf-4e79-bbea-c63496891ead",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    useDevAuth: process.env.EXPO_PUBLIC_USE_DEV_AUTH === "true",
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ??
        "67a39614-b3cf-4e79-bbea-c63496891ead",
    },
  },
});
