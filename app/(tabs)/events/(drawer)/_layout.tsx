import { View, Text, StyleSheet } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EventFilterProvider, useEventFilters } from '../../../../src/context/EventFilterContext';
import { EventFilterDrawer } from '../../../../src/components/EventFilterDrawer';
import { HapticPressable } from '../../../../src/components/HapticPressable';
import { colors } from '../../../../src/theme/colors';

function FilterButton() {
  const navigation = useNavigation();
  const { selectedDateRange, selectedCategories, showFollowingOnly } = useEventFilters();

  const activeFilterCount =
    (selectedDateRange ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0);

  return (
    <HapticPressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
      <Ionicons
        name="options"
        size={22}
        color={activeFilterCount > 0 ? colors.primary : colors.textMuted}
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
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default function EventsDrawerLayout() {
  return (
    <EventFilterProvider>
      <Drawer
        screenOptions={{ headerShown: false, drawerPosition: 'right' }}
        drawerContent={(props) => <EventFilterDrawer {...props} />}
      >
        <Drawer.Screen
          name="index"
          options={{
            headerShown: true,
            headerTitle: 'Events',
            headerTransparent: true,
            headerRight: () => <FilterButton />,
          }}
        />
      </Drawer>
    </EventFilterProvider>
  );
}
