import { Stack } from 'expo-router';

export default function MapLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="place/[placeId]"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Map' }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Map' }}
      />
      <Stack.Screen
        name="user/[userId]"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}
