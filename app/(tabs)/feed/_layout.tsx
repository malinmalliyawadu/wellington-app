import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { colors } from "../../../src/theme/colors";

function DiscoverButton() {
  const router = useRouter();
  return (
    <HapticPressable
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
      }}
      onPress={() => router.push("/feed/discover")}
    >
      <Ionicons name="people-outline" size={22} color={colors.text} />
    </HapticPressable>
  );
}

export default function FeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Feed",
          headerTransparent: true,
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
  );
}
