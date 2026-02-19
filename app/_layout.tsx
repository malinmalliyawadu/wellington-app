import { useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useShareIntent } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { prefetchAppImages } from "../src/utils/imagePrefetch";
import { FollowProvider } from "../src/context/FollowContext";
import { LikeProvider } from "../src/context/LikeContext";
import { SaveProvider } from "../src/context/SaveContext";
import { ToastProvider } from "../src/context/ToastContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { ExplorationProvider } from "../src/context/ExplorationContext";
import { LocationProvider } from "../src/context/LocationContext";
import { ZoomOverlayProvider } from "../src/context/ZoomOverlayContext";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const WEBSITE_HOST = (
  process.env.EXPO_PUBLIC_WELLY_WEBSITE_URL || "https://welly.nz"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

// Map website paths to in-app routes
const WEBSITE_PATH_MAP: Record<string, (id: string) => string> = {
  post: (id) => `/feed/post/${id}`,
  place: (id) => `/feed/place/${id}`,
  user: (id) => `/feed/user/${id}`,
  event: (id) => `/events/${id}`,
};

function parseShareIntentRoute(url: string): string | null {
  // Match wellington:// deep links
  const deepLinkMatch = url.match(/wellington:\/\/\/?(.+)/);
  if (deepLinkMatch) {
    const path = "/" + deepLinkMatch[1];
    if (
      path.startsWith("/feed/post/") ||
      path.startsWith("/feed/place/") ||
      path.startsWith("/feed/user/") ||
      path.startsWith("/events/")
    ) {
      return path;
    }
    return null;
  }

  // Match https://welly.nz/post/{id}, /event/{id}, /place/{id}, /user/{id}
  const websiteMatch = url.match(
    new RegExp(`https?://${WEBSITE_HOST.replace(/\./g, "\\.")}/(post|event|place|user)/([^/?#]+)`)
  );
  if (websiteMatch) {
    const [, type, id] = websiteMatch;
    const mapper = WEBSITE_PATH_MAP[type];
    if (mapper) return mapper(id);
  }

  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (loading) return;

    const onLoginPage = segments[0] === "login";
    const onOnboardingPage = segments[0] === "onboarding";

    if (!session && !onLoginPage) {
      router.replace("/login");
    } else if (
      session &&
      !profile?.onboardingCompleted &&
      !onOnboardingPage &&
      !onLoginPage
    ) {
      router.replace("/onboarding");
    } else if (
      session &&
      profile?.onboardingCompleted &&
      (onLoginPage || onOnboardingPage)
    ) {
      router.replace("/(tabs)/map");
    } else if (session && onLoginPage) {
      // Session exists, on login page, but onboarding status not yet loaded — go to onboarding
      router.replace("/onboarding");
    }
  }, [session, profile?.onboardingCompleted, loading, segments]);

  // Handle content shared into the app via the share extension
  useEffect(() => {
    if (!hasShareIntent || !session) return;

    // Check for wellington:// deep links first
    let route: string | null = null;

    if (shareIntent.type === "weburl" && shareIntent.webUrl) {
      route = parseShareIntentRoute(shareIntent.webUrl);
    } else if (shareIntent.type === "text" && shareIntent.text) {
      // Match wellington:// deep links or https://welly.nz/... URLs
      const urlMatch = shareIntent.text.match(
        /(wellington:\/\/\S+|https?:\/\/[^\s]+)/
      );
      if (urlMatch) {
        route = parseShareIntentRoute(urlMatch[1]);
      }
    }

    if (route) {
      router.push(route as any);
    } else {
      // External content (Instagram, Safari, etc.) → open create screen
      const sharedData: {
        text?: string;
        imageUri?: string;
        videoUri?: string;
        mediaWidth?: number;
        mediaHeight?: number;
        mediaFiles?: Array<{
          uri: string;
          type: "photo" | "video";
          width?: number;
          height?: number;
        }>;
      } = {};

      if (shareIntent.type === "weburl" && shareIntent.webUrl) {
        sharedData.text = shareIntent.webUrl;
      } else if (shareIntent.type === "text" && shareIntent.text) {
        sharedData.text = shareIntent.text;
      }

      if (
        shareIntent.type === "media" &&
        shareIntent.files &&
        shareIntent.files.length > 0
      ) {
        if (shareIntent.files.length > 1) {
          // Multi-file share: pass all files as array
          sharedData.mediaFiles = shareIntent.files.map((file: any) => ({
            uri: file.path,
            type: file.mimeType?.startsWith("video/")
              ? ("video" as const)
              : ("photo" as const),
            width: file.width || undefined,
            height: file.height || undefined,
          }));
        } else {
          const file = shareIntent.files[0];
          if (file.mimeType?.startsWith("video/")) {
            sharedData.videoUri = file.path;
          } else {
            sharedData.imageUri = file.path;
          }
          if (file.width) sharedData.mediaWidth = file.width;
          if (file.height) sharedData.mediaHeight = file.height;
        }
      }

      if (
        sharedData.text ||
        sharedData.imageUri ||
        sharedData.videoUri ||
        sharedData.mediaFiles
      ) {
        (global as any).__sharedIntent = sharedData;
        router.push("/feed/create-post" as any);
      }
    }

    resetShareIntent();
  }, [hasShareIntent, shareIntent, session]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Pacifico_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <ZoomOverlayProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <LocationProvider>
                <FollowProvider>
                  <LikeProvider>
                    <SaveProvider>
                    <NotificationProvider>
                      <ToastProvider>
                        <ExplorationProvider>
                          <AuthGate>
                            <Slot />
                          </AuthGate>
                          <StatusBar style="auto" />
                        </ExplorationProvider>
                      </ToastProvider>
                    </NotificationProvider>
                    </SaveProvider>
                  </LikeProvider>
                </FollowProvider>
              </LocationProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </ZoomOverlayProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
