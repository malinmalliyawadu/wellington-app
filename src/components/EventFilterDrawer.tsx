import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { CATEGORY_COLORS } from './EventCard';
import { useEventFilters } from '../context/EventFilterContext';
import { colors } from '../theme/colors';

type DateRange = 'today' | 'tomorrow' | 'weekend' | 'month';
type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community';

const DATE_RANGES: { key: DateRange; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'today', label: 'Today', icon: 'today' },
  { key: 'tomorrow', label: 'Tomorrow', icon: 'arrow-forward' },
  { key: 'weekend', label: 'This Weekend', icon: 'sunny' },
  { key: 'month', label: 'This Month', icon: 'calendar' },
];

const ALL_CATEGORIES: EventCategory[] = ['music', 'comedy', 'art', 'food', 'market', 'community'];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Music',
  comedy: 'Comedy',
  art: 'Art',
  food: 'Food & Drink',
  market: 'Market',
  community: 'Community',
};

const CATEGORY_ICONS: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  music: 'musical-notes',
  comedy: 'happy',
  art: 'color-palette',
  food: 'restaurant',
  market: 'cart',
  community: 'people',
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
  } = useEventFilters();

  const hasAnyFilter = selectedDateRange != null || selectedCategories.length > 0 || showFollowingOnly;

  const clearAll = () => {
    setSelectedDateRange(null);
    clearCategories();
    setShowFollowingOnly(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasAnyFilter && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearAll}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Date Range Section */}
        <Text style={styles.sectionTitle}>When</Text>
        <TouchableOpacity
          style={[styles.option, selectedDateRange === null && styles.optionActive]}
          onPress={() => setSelectedDateRange(null)}
        >
          <Ionicons name="infinite" size={20} color={selectedDateRange === null ? colors.primary : colors.text} />
          <Text style={[styles.optionLabel, selectedDateRange === null && styles.optionLabelActive]}>
            Any time
          </Text>
          {selectedDateRange === null && (
            <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </TouchableOpacity>

        {DATE_RANGES.map(({ key, label, icon }) => {
          const active = selectedDateRange === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelectedDateRange(key)}
            >
              <Ionicons name={icon} size={20} color={active ? colors.primary : colors.text} />
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
              {active && <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.check} />}
            </TouchableOpacity>
          );
        })}

        {/* Category Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category</Text>
          {selectedCategories.length > 0 && (
            <TouchableOpacity onPress={clearCategories}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {ALL_CATEGORIES.map((cat) => {
          const active = selectedCategories.includes(cat);
          const catColor = CATEGORY_COLORS[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => toggleCategory(cat)}
            >
              <Ionicons name={CATEGORY_ICONS[cat]} size={20} color={catColor} />
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
              {active && <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.check} />}
            </TouchableOpacity>
          );
        })}

        {/* Following Section */}
        <Text style={styles.sectionTitle}>People</Text>
        <TouchableOpacity
          style={[styles.option, showFollowingOnly && styles.optionActive]}
          onPress={() => setShowFollowingOnly(!showFollowingOnly)}
        >
          <Ionicons name="people" size={20} color={showFollowingOnly ? colors.primary : colors.text} />
          <Text style={[styles.optionLabel, showFollowingOnly && styles.optionLabelActive]}>
            Following only
          </Text>
          {showFollowingOnly && (
            <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.check} />
          )}
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.closeDrawer()}
      >
        <Text style={styles.doneText}>Show results</Text>
      </TouchableOpacity>
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
    fontWeight: '700',
    color: colors.text,
  },
  clearAll: {
    fontSize: 14,
    fontWeight: '600',
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
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 24,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
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
  },
});
