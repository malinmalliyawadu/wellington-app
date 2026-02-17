import { View, Text, StyleSheet } from "react-native";
import { Stack, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  EventFilterProvider,
  useEventFilters,
} from "../../../src/context/EventFilterContext";
import { HapticPressable } from "../../../src/components/HapticPressable";
import { colors } from "../../../src/theme/colors";

function FilterButton() {
  const navigation = useNavigation();
  const { selectedDateRange, selectedCategories, showFollowingOnly } =
    useEventFilters();

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
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <Ionicons
        name="options"
        size={22}
        color={activeFilterCount > 0 ? colors.primary : colors.text}
      />
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

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
