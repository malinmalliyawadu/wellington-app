import { Stack } from "expo-router";

export default function MapLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen
        name="place/[placeId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Map",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Map",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="user/[userId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="event/[eventId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Map",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="trail/[trailId]"
        options={{
          presentation: "formSheet",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
        }}
      />
      <Stack.Screen
        name="place-posts/[placeId]"
        options={{
          presentation: "formSheet",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
        }}
      />
      <Stack.Screen
        name="likes"
        options={{
          presentation: "formSheet",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          sheetInitialDetentIndex: 0,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
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
      <Stack.Screen
        name="ai-chat"
        options={{
          headerShown: true,
          headerTitle: "Welly AI",
          headerBackTitle: "Map",
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
