import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FollowProvider } from '../src/context/FollowContext';
import { LikeProvider } from '../src/context/LikeContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FollowProvider>
        <LikeProvider>
          <Slot />
          <StatusBar style="auto" />
        </LikeProvider>
      </FollowProvider>
    </SafeAreaProvider>
  );
}
