import { Drawer } from "expo-router/drawer";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { EventFilterDrawer } from "../../../../src/components/EventFilterDrawer";
import { useEventFilters } from "../../../../src/context/EventFilterContext";
import { LiquidGlassButton } from "../../../../src/components/LiquidGlassButton";
import { HapticPressable } from "src/components/HapticPressable";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "src/theme/colors";

function FilterButton() {
  const navigation = useNavigation();
  const { selectedDateRange, selectedCategories, showFollowingOnly } =
    useEventFilters();

  const activeFilterCount =
    (selectedDateRange ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0);

  return (
    <LiquidGlassButton
      icon="options"
      iconOnly
      size="large"
      variant={activeFilterCount > 0 ? "primary" : "secondary"}
      style={{ marginRight: 16 }}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    />
  );
}

export default function EventsDrawerLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerPosition: "right" }}
      drawerContent={(props) => <EventFilterDrawer {...props} />}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Events",
          headerTransparent: true,
          headerRight: () => <FilterButton />,
        }}
      />
    </Drawer>
  );
}
