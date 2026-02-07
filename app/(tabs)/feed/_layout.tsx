import { Stack } from 'expo-router';

export default function FeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="user/[userId]"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Feed' }}
      />
      <Stack.Screen
        name="follow-list"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="discover"
        options={{ headerShown: true, headerTitle: 'Discover People', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="place/[placeId]"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Feed' }}
      />
    </Stack>
  );
}
