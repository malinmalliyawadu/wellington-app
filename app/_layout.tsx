import { useEffect, useRef } from "react";
import { AppState, InteractionManager, Linking } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/lib/queryClient";
import { setupNetworkManager } from "../src/lib/networkManager";
import { Slot, useRouter, useSegments, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useShareIntent } from "expo-share-intent";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { posthog } from "../src/config/posthog";
import * as SplashScreen from "expo-splash-screen";
import { ErrorScreen } from "../src/components/ErrorScreen";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/theme/ThemeContext";

import { NetworkProvider } from "../src/context/NetworkContext";
import { FollowProvider } from "../src/context/FollowContext";
import { BlockProvider, useBlock } from "../src/context/BlockContext";
import { LikeProvider } from "../src/context/LikeContext";
import { SaveProvider } from "../src/context/SaveContext";
import { ToastProvider, useToast } from "../src/context/ToastContext";
import { NotificationProvider, useNotifications } from "../src/context/NotificationContext";
import { PointsProvider } from "../src/context/PointsContext";
import { LocationProvider } from "../src/context/LocationContext";
import { ZoomOverlayProvider } from "../src/context/ZoomOverlayContext";
import { StatusBar } from "expo-status-bar";
import { useOTAUpdates } from "../src/hooks/useOTAUpdates";
import { getProfileById } from "../src/services/users";
import type { Notification, NotificationType } from "../src/services/notifications";

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return <ErrorScreen error={error} retry={retry} />;
}

setupNetworkManager();
SplashScreen.preventAutoHideAsync();

const WEBSITE_HOST = (
  process.env.EXPO_PUBLIC_WELLY_WEBSITE_URL || "https://wellyapp.nz"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

// Map website/deep-link path types to in-app routes
const DEEP_LINK_PATH_MAP: Record<string, (id: string) => string> = {
  post: (id) => `/feed/post/${id}`,
  place: (id) => `/feed/place/${id}`,
  user: (id) => `/feed/user/${id}`,
  event: (id) => `/events/${id}`,
  guide: (id) => `/feed/guide/${id}`,
  trail: (id) => `/map/trail/${id}`,
};

function parseDeepLinkRoute(url: string): string | null {
  // Match wellington://<type>/<id> deep links
  const deepLinkMatch = url.match(/wellington:\/\/\/?(\w+)\/([^/?#]+)/);
  if (deepLinkMatch) {
    const [, type, id] = deepLinkMatch;
    const mapper = DEEP_LINK_PATH_MAP[type];
    if (mapper) return mapper(id);
    return null;
  }

  // Match https://wellyapp.nz/<type>/<id> universal links
  const websiteMatch = url.match(
    new RegExp(
      `https?://${WEBSITE_HOST.replace(
        /\./g,
        "\\."
      )}/(post|event|place|user|guide|trail)/([^/?#]+)`
    )
  );
  if (websiteMatch) {
    const [, type, id] = websiteMatch;
    const mapper = DEEP_LINK_PATH_MAP[type];
    if (mapper) return mapper(id);
  }

  return null;
}

const NOTIFICATION_MESSAGES: Record<NotificationType, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  guide_like: "liked your guide",
  guide_comment: "commented on your guide",
  event_attendance: "is going to your event",
  event_reminder: "Event starting soon",
  comment_reply: "replied to your comment",
  mention: "mentioned you",
};

// Tracks screen views with Expo Router
// @see https://posthog.com/docs/libraries/react-native#with-expo-router
function ScreenTracker() {
  const ph = usePostHog();
  const pathname = usePathname();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      ph.screen(pathname, { previous_screen: previousPathname.current ?? null });
      previousPathname.current = pathname;
    }
  }, [pathname, ph]);

  return null;
}

function NotificationBannerBridge() {
  const { onNewNotificationRef } = useNotifications();
  const { isBlocked } = useBlock();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    onNewNotificationRef.current = (notification: Notification) => {
      // Only show when app is in foreground
      if (AppState.currentState !== 'active') return;

      // Don't show notifications from blocked users
      if (isBlocked(notification.actorId)) return;

      const message = NOTIFICATION_MESSAGES[notification.type] ?? "sent you a notification";

      // Look up actor info asynchronously, show toast with whatever we get
      getProfileById(notification.actorId)
        .then((actor) => {
          const displayName = actor?.displayName ?? "Someone";
          showToast({
            message: `${displayName} ${message}`,
            type: 'notification',
            avatarUrl: actor?.avatarUrl || undefined,
            duration: 4000,
            onPress: () => {
              if (notification.type === 'follow') {
                router.push(`/profile/user/${notification.actorId}` as any);
              } else if (notification.eventId) {
                router.push(`/events/${notification.eventId}` as any);
              } else if (notification.postId) {
                router.push(`/feed/post/${notification.postId}` as any);
              }
            },
          });
        })
        .catch(() => {
          showToast({
            message: `Someone ${message}`,
            type: 'notification',
            duration: 4000,
          });
        });
    };

    return () => {
      onNewNotificationRef.current = null;
    };
  }, [onNewNotificationRef, showToast, router, isBlocked]);

  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  // Hide splash screen once auth loading completes.
  // This lives here (not in index.tsx) because <Redirect> can unmount index.tsx
  // before its useEffect fires, leaving the splash screen stuck.
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // Auth routing
  useEffect(() => {
    if (loading) return;

    const onLoginPage = segments[0] === "login";
    const onOnboardingPage = segments[0] === "onboarding";
    const inTabs = segments[0] === "(tabs)";

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
      // Navigate to tabs — deep link will be consumed once tabs are mounted
      router.replace("/(tabs)/map");
    } else if (session && onLoginPage) {
      // Session exists, on login page, but onboarding status not yet loaded — go to onboarding
      router.replace("/onboarding");
    }

    // Consume pending deep link once the tab navigator is mounted
    if (session && profile?.onboardingCompleted && inTabs) {
      const pendingDeepLink = (global as any).__pendingDeepLink;
      if (pendingDeepLink) {
        delete (global as any).__pendingDeepLink;
        InteractionManager.runAfterInteractions(() => {
          router.push(pendingDeepLink as any);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile?.onboardingCompleted, loading, segments]);

  // Warm-start deep link handler.
  // +native-intent.tsx handles URL interception at the Expo Router level, but
  // navigation may not always work with NativeTabs. This listener acts as a
  // fallback to ensure deep links are followed when the app is in the background.
  useEffect(() => {
    if (!session || !profile?.onboardingCompleted) return;

    const subscription = Linking.addEventListener("url", ({ url }) => {
      const route = parseDeepLinkRoute(url);
      if (route) {
        router.push(route as any);
      }
    });

    return () => subscription.remove();
  }, [session, profile?.onboardingCompleted, router]);

  // Handle content shared into the app via the share extension
  useEffect(() => {
    if (!hasShareIntent || !session) return;

    // Check for wellington:// deep links first
    let route: string | null = null;

    if (shareIntent.type === "weburl" && shareIntent.webUrl) {
      route = parseDeepLinkRoute(shareIntent.webUrl);
    } else if (shareIntent.type === "text" && shareIntent.text) {
      // Match wellington:// deep links or https://wellyapp.nz/... URLs
      const urlMatch = shareIntent.text.match(
        /(wellington:\/\/\S+|https?:\/\/[^\s]+)/
      );
      if (urlMatch) {
        route = parseDeepLinkRoute(urlMatch[1]);
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
        mediaFiles?: {
          uri: string;
          type: "photo" | "video";
          width?: number;
          height?: number;
        }[];
      } = {};

      if (shareIntent.type === "weburl" && shareIntent.webUrl) {
        sharedData.text = shareIntent.webUrl;
      } else if (shareIntent.type === "text" && shareIntent.text) {
        sharedData.text = shareIntent.text;
      }

      if (
        (shareIntent.type === "media" || shareIntent.type === "file") &&
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent, shareIntent, session]);

  // Set up push notifications
  usePushNotifications();

  return (
    <>
      <NotificationBannerBridge />
      {children}
    </>
  );
}

export default function RootLayout() {
  useOTAUpdates();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Pacifico_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false, // Manual screen tracking with Expo Router
        captureTouches: true,
        propsToCapture: ["testID"],
        maxElementsCaptured: 20,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <ThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ZoomOverlayProvider>
                <SafeAreaProvider>
                  <AuthProvider>
                    <LocationProvider>
                      <FollowProvider>
                        <BlockProvider>
                        <LikeProvider>
                          <SaveProvider>
                            <NotificationProvider>
                              <ToastProvider>
                                <PointsProvider>
                                  <ScreenTracker />
                                  <AuthGate>
                                    <Slot />
                                    <OfflineBanner />
                                  </AuthGate>
                                  <StatusBar style="auto" />
                                </PointsProvider>
                              </ToastProvider>
                            </NotificationProvider>
                          </SaveProvider>
                        </LikeProvider>
                        </BlockProvider>
                      </FollowProvider>
                    </LocationProvider>
                  </AuthProvider>
                </SafeAreaProvider>
              </ZoomOverlayProvider>
            </GestureHandlerRootView>
          </ThemeProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}
