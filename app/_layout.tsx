import { useEffect, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useShareIntent } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { FollowProvider } from '../src/context/FollowContext';
import { LikeProvider } from '../src/context/LikeContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ExplorationProvider } from '../src/context/ExplorationContext';
import { LocationProvider } from '../src/context/LocationContext';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

function parseShareIntentRoute(url: string): string | null {
  // Match wellington:// deep links shared into the app
  const match = url.match(/wellington:\/\/\/?(.+)/);
  if (!match) return null;
  const path = '/' + match[1];
  // Only navigate to known routes
  if (
    path.startsWith('/feed/post/') ||
    path.startsWith('/feed/place/') ||
    path.startsWith('/feed/user/') ||
    path.startsWith('/events/')
  ) {
    return path;
  }
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (loading) return;

    const onLoginPage = segments[0] === 'login';

    if (!session && !onLoginPage) {
      router.replace('/login');
    } else if (session && onLoginPage) {
      router.replace('/(tabs)/map');
    }
  }, [session, loading, segments]);

  // Handle content shared into the app via the share extension
  useEffect(() => {
    if (!hasShareIntent || !session) return;

    // Check for wellington:// deep links first
    let route: string | null = null;

    if (shareIntent.type === 'weburl' && shareIntent.webUrl) {
      route = parseShareIntentRoute(shareIntent.webUrl);
    } else if (shareIntent.type === 'text' && shareIntent.text) {
      const urlMatch = shareIntent.text.match(/(wellington:\/\/\S+)/);
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
          type: 'photo' | 'video';
          width?: number;
          height?: number;
        }>;
      } = {};

      if (shareIntent.type === 'weburl' && shareIntent.webUrl) {
        sharedData.text = shareIntent.webUrl;
      } else if (shareIntent.type === 'text' && shareIntent.text) {
        sharedData.text = shareIntent.text;
      }

      if (shareIntent.type === 'media' && shareIntent.files && shareIntent.files.length > 0) {
        if (shareIntent.files.length > 1) {
          // Multi-file share: pass all files as array
          sharedData.mediaFiles = shareIntent.files.map((file: any) => ({
            uri: file.path,
            type: file.mimeType?.startsWith('video/') ? 'video' as const : 'photo' as const,
            width: file.width || undefined,
            height: file.height || undefined,
          }));
        } else {
          const file = shareIntent.files[0];
          if (file.mimeType?.startsWith('video/')) {
            sharedData.videoUri = file.path;
          } else {
            sharedData.imageUri = file.path;
          }
          if (file.width) sharedData.mediaWidth = file.width;
          if (file.height) sharedData.mediaHeight = file.height;
        }
      }

      if (sharedData.text || sharedData.imageUri || sharedData.videoUri || sharedData.mediaFiles) {
        (global as any).__sharedIntent = sharedData;
        router.push('/feed/create-post' as any);
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
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <FollowProvider>
              <LikeProvider>
                <ToastProvider>
                  <ExplorationProvider>
                    <AuthGate>
                      <Slot />
                    </AuthGate>
                    <StatusBar style="auto" />
                  </ExplorationProvider>
                </ToastProvider>
              </LikeProvider>
            </FollowProvider>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
