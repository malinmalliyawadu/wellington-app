import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbol } from 'expo-symbols';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { CATEGORY_COLORS } from './EventCard';
import { useEventFilters } from '../context/EventFilterContext';
import { colors } from '../theme/colors';
import { HapticPressable } from './HapticPressable';
import { SFIcon } from './SFIcon';
import { fonts } from "../theme/fonts";

type DateRange = 'today' | 'tomorrow' | 'weekend' | 'month';
type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community' | 'quiz' | 'craft' | 'kids' | 'cultural';

const DATE_RANGES: { key: DateRange; label: string; icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap } }[] = [
  { key: 'today', label: 'Today', icon: { sf: 'calendar.badge.clock', fallback: 'today' } },
  { key: 'tomorrow', label: 'Tomorrow', icon: { sf: 'arrow.right', fallback: 'arrow-forward' } },
  { key: 'weekend', label: 'This Weekend', icon: { sf: 'sun.max.fill', fallback: 'sunny' } },
  { key: 'month', label: 'This Month', icon: { sf: 'calendar', fallback: 'calendar' } },
];

const ALL_CATEGORIES: EventCategory[] = ['music', 'comedy', 'art', 'food', 'market', 'community', 'quiz', 'craft', 'kids', 'cultural'];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Music',
  comedy: 'Comedy',
  art: 'Art',
  food: 'Food & Drink',
  market: 'Market',
  community: 'Community',
  quiz: 'Quiz',
  craft: 'Craft',
  kids: 'Kids',
  cultural: 'Cultural',
};

const CATEGORY_ICONS: Record<EventCategory, { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }> = {
  music: { sf: 'music.note.list', fallback: 'musical-notes' },
  comedy: { sf: 'face.smiling', fallback: 'happy' },
  art: { sf: 'paintpalette.fill', fallback: 'color-palette' },
  food: { sf: 'fork.knife', fallback: 'restaurant' },
  market: { sf: 'cart.fill', fallback: 'cart' },
  community: { sf: 'person.2', fallback: 'people' },
  quiz: { sf: 'questionmark.circle', fallback: 'help-circle' },
  craft: { sf: 'scissors', fallback: 'cut' },
  kids: { sf: 'figure.and.child.holdinghands', fallback: 'happy' },
  cultural: { sf: 'building.columns', fallback: 'globe' },
};

export function EventFilterDrawer({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedDateRange,
    setSelectedDateRange,
    selectedCategories,
    toggleCategory,
    clearCategories,
    showFollowingOnly,
    setShowFollowingOnly,
    showFreeOnly,
    setShowFreeOnly,
  } = useEventFilters();

  const hasAnyFilter = selectedDateRange != null || selectedCategories.length > 0 || showFollowingOnly || showFreeOnly;

  const clearAll = () => {
    setSelectedDateRange(null);
    clearCategories();
    setShowFollowingOnly(false);
    setShowFreeOnly(false);
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
        {/* Date Range Section */}
        <Text style={styles.sectionTitle}>When</Text>
        <HapticPressable
          style={[styles.option, selectedDateRange === null && styles.optionActive]}
          onPress={() => setSelectedDateRange(null)}
        >
          <SFIcon name="infinity" fallback="infinite" size={20} color={selectedDateRange === null ? colors.primary : colors.text} />
          <Text style={[styles.optionLabel, selectedDateRange === null && styles.optionLabelActive]}>
            Any time
          </Text>
          {selectedDateRange === null && (
            <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </HapticPressable>

        {DATE_RANGES.map(({ key, label, icon }) => {
          const active = selectedDateRange === key;
          return (
            <HapticPressable
              key={key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelectedDateRange(key)}
            >
              <SFIcon name={icon.sf} fallback={icon.fallback} size={20} color={active ? colors.primary : colors.text} />
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
              {active && <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />}
            </HapticPressable>
          );
        })}

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
          const catColor = CATEGORY_COLORS[cat];
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

        {/* Price Section */}
        <Text style={styles.sectionTitle}>Price</Text>
        <HapticPressable
          style={[styles.option, showFreeOnly && styles.optionActive]}
          onPress={() => setShowFreeOnly(!showFreeOnly)}
        >
          <SFIcon name="dollarsign.circle" fallback="cash-outline" size={20} color={showFreeOnly ? colors.primary : colors.text} />
          <Text style={[styles.optionLabel, showFreeOnly && styles.optionLabelActive]}>
            Free events only
          </Text>
          {showFreeOnly && (
            <SFIcon name="checkmark" fallback="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </HapticPressable>

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
    marginTop: 24,
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
