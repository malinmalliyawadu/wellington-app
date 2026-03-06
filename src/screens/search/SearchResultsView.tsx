import React from "react";
import { View, Text, ScrollView, SectionList } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import { SearchResultItem } from "./SearchResultItem";
import { ShimmerBlock } from "./ShimmerBlock";
import { FILTER_CHIPS } from "./constants";
import { createStyles } from "./searchStyles";
import type { Colors } from "../../theme/ThemeContext";
import type { Place } from "../../types";
import type { FilterType, SearchResult } from "./constants";

interface SearchResultsViewProps {
  query: string;
  colors: Colors;
  insetTop: number;
  filteredSections: { title: string; data: SearchResult[] }[];
  activeFilter: FilterType;
  googleLoading: boolean;
  places: Place[] | null;
  eventPlaces: Map<string, Place>;
  creatingPlaceId: string | null;
  onFilterChange: (filter: FilterType) => void;
  onPlacePress: (placeId: string) => void;
  onGooglePlacePress: (placeData: Omit<Place, "id">) => void;
  onUserPress: (userId: string) => void;
  onPostPress: (postId: string) => void;
  onEventPress: (eventId: string) => void;
  onGuidePress: (guideId: string) => void;
  onHashtagPress: (tagName: string) => void;
}

export function SearchResultsView({
  query,
  colors,
  insetTop,
  filteredSections,
  activeFilter,
  googleLoading,
  places,
  eventPlaces,
  creatingPlaceId,
  onFilterChange,
  onPlacePress,
  onGooglePlacePress,
  onUserPress,
  onPostPress,
  onEventPress,
  onGuidePress,
  onHashtagPress,
}: SearchResultsViewProps) {
  const styles = createStyles(colors);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SearchResultItem
            item={item}
            colors={colors}
            places={places}
            eventPlaces={eventPlaces}
            creatingPlaceId={creatingPlaceId}
            onPlacePress={onPlacePress}
            onGooglePlacePress={onGooglePlacePress}
            onUserPress={onUserPress}
            onPostPress={onPostPress}
            onEventPress={onEventPress}
            onGuidePress={onGuidePress}
            onHashtagPress={onHashtagPress}
          />
        )}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
            <Text style={styles.sectionHeaderCount}>
              {section.data.length}
            </Text>
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.title === "Places" && googleLoading) {
            return (
              <View style={styles.shimmerRow}>
                <ShimmerBlock
                  width={44}
                  height={44}
                  borderRadius={10}
                  colors={colors}
                />
                <View style={styles.shimmerTextCol}>
                  <ShimmerBlock
                    width={160}
                    height={14}
                    borderRadius={4}
                    colors={colors}
                  />
                  <ShimmerBlock
                    width={100}
                    height={12}
                    borderRadius={4}
                    colors={colors}
                    style={{ marginTop: 6 }}
                  />
                </View>
              </View>
            );
          }
          return null;
        }}
        contentContainerStyle={[
          styles.searchResults,
          { paddingTop: insetTop },
        ]}
        ListHeaderComponent={
          <View>
            {/* Filter Chip Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipBar}
            >
              {FILTER_CHIPS.map((chip) => {
                const isActive = activeFilter === chip.key;
                return (
                  <HapticPressable
                    key={chip.key}
                    style={[
                      styles.filterChip,
                      isActive
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.gray100 },
                    ]}
                    onPress={() => onFilterChange(chip.key)}
                  >
                    <SFIcon
                      name={chip.icon}
                      fallback={chip.fallback}
                      size={14}
                      color={isActive ? "#FFFFFF" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive
                          ? { color: "#FFFFFF" }
                          : { color: colors.text },
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </HapticPressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <SFIcon
              name="magnifyingglass"
              fallback="search"
              size={48}
              color={colors.gray300}
            />
            <Text style={styles.emptyTitle}>
              No results for &ldquo;{query}&rdquo;
            </Text>
            <Text style={styles.emptySubtext}>
              Try searching for places, people, or events
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
}
