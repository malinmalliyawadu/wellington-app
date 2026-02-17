import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { FollowProvider } from '../src/context/FollowContext';
import { LikeProvider } from '../src/context/LikeContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ExplorationProvider } from '../src/context/ExplorationContext';
import { StatusBar } from 'expo-status-bar';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const onLoginPage = segments[0] === 'login';

    if (!session && !onLoginPage) {
      router.replace('/login');
    } else if (session && onLoginPage) {
      router.replace('/(tabs)/map');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
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
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
