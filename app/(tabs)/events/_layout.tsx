import { Stack } from "expo-router";
import { EventFilterProvider } from "../../../src/context/EventFilterContext";
import { ErrorScreen } from "../../../src/components/ErrorScreen";
import { useEventFilters } from "../../../src/context/EventFilterContext";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { SFIcon } from "../../../src/components/SFIcon";
import { colors } from "../../../src/theme/colors";

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return <ErrorScreen error={error} retry={retry} />;
}

function FilterButton() {
  const {
    selectedDateRange,
    selectedCategories,
    showFollowingOnly,
    openDrawer,
  } = useEventFilters();

  const activeFilterCount =
    (selectedDateRange ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0);

  return (
    <HapticPressable
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
      }}
      onPress={openDrawer}
    >
      <SFIcon
        name="slider.horizontal.3"
        fallback="options"
        size={22}
        color={activeFilterCount > 0 ? colors.primary : colors.text}
      />
    </HapticPressable>
  );
}

export default function EventsLayout() {
  return (
    <EventFilterProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(drawer)"
          options={{
            headerShown: true,
            headerTitle: "Events",
            headerTransparent: true,
            headerRight: () => <FilterButton />,
          }}
        />
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
        <Stack.Screen
          name="hashtag/[tag]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="guide/[guideId]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Events",
            headerTransparent: true,
          }}
        />
      </Stack>
    </EventFilterProvider>
  );
}
