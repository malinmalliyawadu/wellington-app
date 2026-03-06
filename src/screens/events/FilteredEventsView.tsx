import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFIcon } from "../../components/SFIcon";
import { EventCard } from "../../components/EventCard";
import { HapticPressable } from "../../components/HapticPressable";
import { FloatingCreateButton } from "../../components/FloatingCreateButton";
import { QuickFilterChips } from "./QuickFilterChips";
import type { EventWithPlace } from "./eventsHelpers";
import type { EventsStyles } from "./eventsStyles";
import type { Colors } from "../../theme/ThemeContext";
import type { User } from "../../types";

interface FilteredEventsViewProps {
  filteredEventsWithPlaces: EventWithPlace[];
  navigateToEvent: (eventId: string) => void;
  attendeeProfiles: User[] | undefined;
  handleLoadMore: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  filterSummary: string;
  isChipActive: (key: string) => boolean;
  onChipPress: (key: string) => void;
  advancedFilterCount: number;
  openFilters: () => void;
  styles: EventsStyles;
  colors: Colors;
}

export function FilteredEventsView({
  filteredEventsWithPlaces,
  navigateToEvent,
  attendeeProfiles,
  handleLoadMore,
  refreshing,
  onRefresh,
  isFetchingNextPage,
  hasNextPage,
  filterSummary,
  isChipActive,
  onChipPress,
  advancedFilterCount,
  openFilters,
  styles,
  colors,
}: FilteredEventsViewProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <FlatList
        testID="events-list"
        data={filteredEventsWithPlaces}
        keyExtractor={(item) => item.event.id}
        renderItem={({ item }) => (
          <View style={styles.comingUpItemSpacing}>
            <EventCard
              event={item.event}
              place={item.place}
              onEventPress={navigateToEvent}
              attendeeProfiles={attendeeProfiles ?? undefined}
            />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentInset={{ top: headerHeight }}
        contentOffset={{ x: 0, y: -headerHeight }}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 40 + insets.bottom },
        ]}
        ListHeaderComponent={
          <View>
            <QuickFilterChips
              isChipActive={isChipActive}
              onChipPress={onChipPress}
              advancedFilterCount={advancedFilterCount}
              styles={styles}
              colors={colors}
            />
            {filterSummary ? (
              <View style={styles.filterSummaryRow}>
                <Text style={styles.filterSummary}>{filterSummary}</Text>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasNextPage && filteredEventsWithPlaces.length > 0 ? (
            <View style={styles.footerContainer}>
              <SFIcon
                name="sparkles"
                fallback="sparkles"
                size={28}
                color={colors.gray300}
              />
              <Text style={styles.footerText}>
                That&apos;s everything for now
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <SFIcon
              name="calendar"
              fallback="calendar-outline"
              size={48}
              color={colors.gray300}
            />
            <Text style={styles.emptyText}>No events match your filters</Text>
            <HapticPressable onPress={openFilters}>
              <Text style={styles.emptyAction}>Adjust filters</Text>
            </HapticPressable>
          </View>
        }
      />
      <FloatingCreateButton />
    </View>
  );
}
