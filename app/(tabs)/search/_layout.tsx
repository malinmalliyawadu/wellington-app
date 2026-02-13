import { Stack } from 'expo-router';

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="user/[userId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Search",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="place/[placeId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Search",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Search",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="event/[eventId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Search",
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
