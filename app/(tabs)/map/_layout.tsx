import { Stack } from 'expo-router';

export default function MapLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
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
      <Stack.Screen
        name="place-posts/[placeId]"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          sheetAllowedDetents: [0.5, 0.85],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
      <Stack.Screen
        name="create-post"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          sheetAllowedDetents: [0.85, 1.0],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: false,
        }}
      />
    </Stack>
  );
}
