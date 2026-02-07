import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FollowProvider } from '../src/context/FollowContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FollowProvider>
        <Slot />
        <StatusBar style="auto" />
      </FollowProvider>
    </SafeAreaProvider>
  );
}
