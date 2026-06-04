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
    buildNumber: "1",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
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
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    useDevAuth: process.env.EXPO_PUBLIC_USE_DEV_AUTH === "true",
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
