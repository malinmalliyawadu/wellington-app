import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FollowProvider } from './src/context/FollowContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <FollowProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </FollowProvider>
    </SafeAreaProvider>
  );
}
