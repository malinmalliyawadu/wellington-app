import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen
        name="user/[userId]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Profile',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="follow-list"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="discover"
        options={{
          headerShown: true,
          headerTitle: 'Discover People',
          headerBackTitle: 'Back',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="place/[placeId]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Profile',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Profile',
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
