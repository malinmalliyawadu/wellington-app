import { Stack } from 'expo-router';

export default function EventsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen
        name="[eventId]"
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Events' }}
      />
    </Stack>
  );
}
