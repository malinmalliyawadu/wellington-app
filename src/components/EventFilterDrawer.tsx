import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbol } from 'expo-symbols';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { CATEGORY_COLORS } from './EventCard';
import { useEventFilters } from '../context/EventFilterContext';
import { useTheme, type Colors } from '../theme/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { LiquidGlassButton } from './LiquidGlassButton';
import { SFIcon } from './SFIcon';
import { fonts } from "../theme/fonts";

type DateRange = 'today' | 'tomorrow' | 'weekend' | 'month';
type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community' | 'quiz' | 'craft' | 'kids' | 'cultural' | 'volunteering';

const DATE_OPTIONS: { key: DateRange | null; label: string; icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap } }[] = [
  { key: null, label: 'Any time', icon: { sf: 'infinity', fallback: 'infinite' } },
  { key: 'today', label: 'Today', icon: { sf: 'calendar.badge.clock', fallback: 'today' } },
  { key: 'tomorrow', label: 'Tomorrow', icon: { sf: 'arrow.right', fallback: 'arrow-forward' } },
  { key: 'weekend', label: 'Weekend', icon: { sf: 'sun.max.fill', fallback: 'sunny' } },
  { key: 'month', label: 'This Month', icon: { sf: 'calendar', fallback: 'calendar' } },
];

const ALL_CATEGORIES: EventCategory[] = ['music', 'comedy', 'art', 'food', 'market', 'community', 'quiz', 'craft', 'kids', 'cultural', 'volunteering'];

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
  volunteering: 'Volunteering',
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
  volunteering: { sf: 'hands.sparkles.fill', fallback: 'heart' },
};

function ToggleSwitchRow({
  icon,
  label,
  value,
  onValueChange,
  iconColor,
  colors,
}: {
  icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  iconColor: string;
  colors: Colors;
}) {
  const styles = createStyles(colors);
  return (
    <HapticPressable style={styles.toggleRow} onPress={() => onValueChange(!value)}>
      <SFIcon name={icon.sf} fallback={icon.fallback} size={20} color={iconColor} />
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray300, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </HapticPressable>
  );
}

export function EventFilterDrawer({ navigation }: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
        {/* Date Range — Horizontal Scrolling Chips */}
        <Text style={styles.sectionTitle}>When</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateChipRow}
        >
          {DATE_OPTIONS.map(({ key, label, icon }) => {
            const active = selectedDateRange === key;
            return (
              <HapticPressable
                key={key ?? 'any'}
                style={[
                  styles.dateChip,
                  active
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.background, borderColor: colors.gray300, borderWidth: 1 },
                ]}
                onPress={() => setSelectedDateRange(key)}
              >
                <SFIcon
                  name={icon.sf}
                  fallback={icon.fallback}
                  size={14}
                  color={active ? '#FFFFFF' : colors.text}
                />
                <Text style={[styles.dateChipLabel, active && styles.dateChipLabelActive]}>
                  {label}
                </Text>
              </HapticPressable>
            );
          })}
        </ScrollView>

        {/* Category Chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category</Text>
          {selectedCategories.length > 0 && (
            <HapticPressable onPress={clearCategories}>
              <Text style={styles.clearText}>Clear</Text>
            </HapticPressable>
          )}
        </View>

        <View style={styles.chipGrid}>
          {ALL_CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat);
            const catColor = CATEGORY_COLORS[cat];
            return (
              <HapticPressable
                key={cat}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: catColor }
                    : { backgroundColor: colors.background, borderColor: colors.gray300, borderWidth: 1 },
                ]}
                onPress={() => toggleCategory(cat)}
              >
                <SFIcon
                  name={CATEGORY_ICONS[cat].sf}
                  fallback={CATEGORY_ICONS[cat].fallback}
                  size={16}
                  color={active ? '#FFFFFF' : catColor}
                />
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </HapticPressable>
            );
          })}
        </View>

        {/* Toggle Switches */}
        <Text style={styles.sectionTitle}>Options</Text>
        <View style={styles.toggleCard}>
          <ToggleSwitchRow
            icon={{ sf: 'dollarsign.circle', fallback: 'cash-outline' }}
            label="Free events only"
            value={showFreeOnly}
            onValueChange={setShowFreeOnly}
            iconColor={showFreeOnly ? colors.primary : colors.textMuted}
            colors={colors}
          />
          <View style={styles.toggleDivider} />
          <ToggleSwitchRow
            icon={{ sf: 'person.2', fallback: 'people' }}
            label="Following only"
            value={showFollowingOnly}
            onValueChange={setShowFollowingOnly}
            iconColor={showFollowingOnly ? colors.primary : colors.textMuted}
            colors={colors}
          />
        </View>
      </ScrollView>

      <LiquidGlassButton
        title="Show results"
        onPress={() => navigation.closeDrawer()}
        fullWidth
        size="large"
        style={styles.doneButton}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
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
  dateChipRow: {
    gap: 8,
    paddingRight: 4,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  dateChipLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  dateChipLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  chipLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
  },
  toggleCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 46,
  },
  doneButton: {
    marginTop: 12,
  },
});
