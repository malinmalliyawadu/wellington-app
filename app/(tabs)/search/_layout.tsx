import { Stack } from "expo-router";
import { ErrorScreen } from "../../../src/components/ErrorScreen";
import { useTheme } from "../../../src/theme/ThemeContext";

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}

export default function SearchLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerTintColor: colors.text }}>
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
        name="hashtag/[tag]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Search",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="guide/[guideId]"
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
