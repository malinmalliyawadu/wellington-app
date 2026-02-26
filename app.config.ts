import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  // EAS Build sets EXPO_BUILD_NUMBER when using appVersionSource: "remote"
  const buildNumber = process.env.EXPO_BUILD_NUMBER || "1";

  return {
    ...config,
    name: "Welly",
    slug: "wellington-app",
    version: "1.1.0",
    runtimeVersion: {
      policy: "appVersion",
    },
    scheme: "wellington",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-bg.png",
      resizeMode: "cover",
      backgroundColor: "#4BA3D4",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.malinmw.wellingtonapp",
      buildNumber,
      associatedDomains: ["applinks:wellyapp.nz"],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: ["instagram", "tiktok", "twitter"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.READ_CALENDAR",
        "android.permission.WRITE_CALENDAR",
      ],
      package: "com.malinmw.wellingtonapp",
      versionCode: parseInt(buildNumber, 10),
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-font",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Welly needs your location to show nearby places.",
        },
      ],
      "expo-router",
      "expo-video",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-calendar",
        {
          calendarPermission:
            "Welly needs access to your calendar to add events.",
        },
      ],
      "expo-apple-authentication",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Welly needs access to your photos to share recommendations.",
          cameraPermission:
            "Welly needs access to your camera to take photos.",
        },
      ],
      [
        "expo-share-intent",
        {
          iosActivationRules: {
            NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            NSExtensionActivationSupportsWebPageWithMaxCount: 1,
            NSExtensionActivationSupportsImageWithMaxCount: 1,
            NSExtensionActivationSupportsMovieWithMaxCount: 1,
          },
          androidIntentFilters: ["text/*", "image/*", "video/*"],
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#F5A623",
        },
      ],
      "@react-native-community/datetimepicker",
      [
        "expo-updates",
        {
          url: "https://u.expo.dev/666bd8f1-eab1-419d-bb9c-34ad98a16904",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "666bd8f1-eab1-419d-bb9c-34ad98a16904",
      },
    },
  };
};
