import { Stack, useRouter } from "expo-router";
import { SFIcon } from "../../../src/components/SFIcon";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { ErrorScreen } from "../../../src/components/ErrorScreen";
import { useTheme } from "../../../src/theme/ThemeContext";

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}

function CreateButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <HapticPressable
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
      }}
      onPress={() => router.push("/feed/create-post")}
    >
      <SFIcon name="plus" fallback="add" size={22} color={colors.text} />
    </HapticPressable>
  );
}

function DiscoverButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <HapticPressable
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
      }}
      onPress={() => router.push("/feed/discover")}
    >
      <SFIcon name="person.2" fallback="people-outline" size={22} color={colors.text} />
    </HapticPressable>
  );
}

export default function FeedLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, headerTintColor: colors.text }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Feed",
          headerTransparent: true,
          headerLeft: () => <CreateButton />,
          headerRight: () => <DiscoverButton />,
        }}
      />
      <Stack.Screen
        name="user/[userId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Feed",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="follow-list"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="discover"
        options={{
          headerShown: true,
          headerTitle: "Discover People",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="place/[placeId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Feed",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="post/[postId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Feed",
          headerTransparent: true,
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
        name="event/[eventId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Feed",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="ai-chat"
        options={{
          headerShown: true,
          headerTitle: "Welly AI",
          headerBackTitle: "Feed",
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
          headerBackTitle: "Feed",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="guide/[guideId]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Feed",
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
