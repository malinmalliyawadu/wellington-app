import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbol } from 'expo-symbols';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useMapFilters } from '../context/MapFilterContext';
import { fonts } from "../theme/fonts";
import { PlaceCategory } from '../types';
import { colors } from '../theme/colors';
import { HapticPressable } from './HapticPressable';
import { SFIcon } from './SFIcon';

const ALL_CATEGORIES: PlaceCategory[] = [
  'cafe',
  'restaurant',
  'bar',
  'attraction',
  'park',
  'venue',
];

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
  trail: 'Trail',
};

const CATEGORY_ICONS: Record<PlaceCategory, { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }> = {
  cafe: { sf: 'cup.and.saucer.fill', fallback: 'cafe' },
  restaurant: { sf: 'fork.knife', fallback: 'restaurant' },
  bar: { sf: 'wineglass.fill', fallback: 'wine' },
  attraction: { sf: 'safari', fallback: 'compass' },
  park: { sf: 'leaf.fill', fallback: 'leaf' },
  venue: { sf: 'music.note.list', fallback: 'musical-notes' },
  trail: { sf: 'figure.hiking', fallback: 'walk' },
};

export function MapFilterDrawer({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedCategories,
    toggleCategory,
    clearCategories,
    showFollowingOnly,
    setShowFollowingOnly,
    showTrails,
    setShowTrails,
    showEvents,
    setShowEvents,
  } = useMapFilters();

  const hasAnyFilter = selectedCategories.length > 0 || showFollowingOnly || !showTrails || !showEvents;

  const clearAll = () => {
    clearCategories();
    setShowFollowingOnly(false);
    setShowTrails(true);
    setShowEvents(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 60 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasAnyFilter && (
          <HapticPressable onPress={clearAll}>
            <Text style={styles.clearAll}>Clear all</Text>
          </HapticPressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Category Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category</Text>
          {selectedCategories.length > 0 && (
            <HapticPressable onPress={clearCategories}>
              <Text style={styles.clearText}>Clear</Text>
            </HapticPressable>
          )}
        </View>

        {ALL_CATEGORIES.map((cat) => {
          const active = selectedCategories.includes(cat);
          const catColor = colors.category[cat];
          return (
            <HapticPressable
              key={cat}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => toggleCategory(cat)}
            >
              <SFIcon name={CATEGORY_ICONS[cat].sf} fallback={CATEGORY_ICONS[cat].fallback} size={20} color={catColor} />
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
              {active && <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />}
            </HapticPressable>
          );
        })}

        {/* Following Section */}
        <Text style={styles.sectionTitle}>People</Text>
        <HapticPressable
          style={[styles.option, showFollowingOnly && styles.optionActive]}
          onPress={() => setShowFollowingOnly(!showFollowingOnly)}
        >
          <SFIcon name="person.2" fallback="people" size={20} color={showFollowingOnly ? colors.primary : colors.text} />
          <Text style={[styles.optionLabel, showFollowingOnly && styles.optionLabelActive]}>
            Following only
          </Text>
          {showFollowingOnly && (
            <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </HapticPressable>

        {/* Events Section */}
        <Text style={styles.sectionTitle}>Events</Text>
        <HapticPressable
          style={[styles.option, showEvents && styles.optionActive]}
          onPress={() => setShowEvents(!showEvents)}
        >
          <SFIcon name="calendar" fallback="calendar" size={20} color={showEvents ? colors.category.venue : colors.text} />
          <Text style={[styles.optionLabel, showEvents && styles.optionLabelActive]}>
            Show this week's events
          </Text>
          {showEvents && (
            <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </HapticPressable>

        {/* Trails Section */}
        <Text style={styles.sectionTitle}>Trails</Text>
        <HapticPressable
          style={[styles.option, showTrails && styles.optionActive]}
          onPress={() => setShowTrails(!showTrails)}
        >
          <SFIcon name="figure.hiking" fallback="walk" size={20} color={showTrails ? colors.category.park : colors.text} />
          <Text style={[styles.optionLabel, showTrails && styles.optionLabelActive]}>
            Show hiking trails
          </Text>
          {showTrails && (
            <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </HapticPressable>
      </ScrollView>

      <HapticPressable
        style={styles.doneButton}
        onPress={() => navigation.closeDrawer()}
      >
        <Text style={styles.doneText}>Show results</Text>
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  clearAll: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 24,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
    color: colors.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    marginBottom: 2,
  },
  optionActive: {
    backgroundColor: colors.primary + '10',
  },
  optionLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  optionLabelActive: {
    fontWeight: '600',
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  check: {
    marginLeft: 'auto',
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
});
