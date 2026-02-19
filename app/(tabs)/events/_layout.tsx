import { Stack } from "expo-router";
import { EventFilterProvider } from "../../../src/context/EventFilterContext";

export default function EventsLayout() {
  return (
    <EventFilterProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen
          name="[eventId]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="user/[userId]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="place/[placeId]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="post/[postId]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="ai-chat"
          options={{
            headerShown: true,
            headerTitle: "Welly AI",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="create-post"
          options={{
            presentation: "formSheet",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            sheetAllowedDetents: [0.95, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 32,
            sheetInitialDetentIndex: 0,
            sheetLargestUndimmedDetentIndex: 0,
            sheetExpandsWhenScrolledToEdge: false,
          }}
        />
      </Stack>
    </EventFilterProvider>
  );
}
