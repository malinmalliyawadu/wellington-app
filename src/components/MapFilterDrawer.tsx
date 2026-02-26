import React from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useMapFilters } from "../context/MapFilterContext";
import { fonts } from "../theme/fonts";
import { LiquidGlassButton } from "./LiquidGlassButton";
import { PlaceCategory, TrailDifficulty } from "../types";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { HapticPressable } from "./HapticPressable";
import { SFIcon } from "./SFIcon";

const ALL_CATEGORIES: PlaceCategory[] = [
  "cafe",
  "restaurant",
  "bar",
  "attraction",
  "park",
  "venue",
];

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  bar: "Bar",
  attraction: "Attraction",
  park: "Park",
  venue: "Venue",
  trail: "Trail",
};

const CATEGORY_ICONS: Record<
  PlaceCategory,
  { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }
> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
};

const ALL_DIFFICULTIES: TrailDifficulty[] = ["easy", "moderate", "hard"];

const DIFFICULTY_CONFIG: Record<
  TrailDifficulty,
  {
    label: string;
    colorKey: "success" | "warning" | "error";
    icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
  }
> = {
  easy: {
    label: "Easy",
    colorKey: "success",
    icon: { sf: "checkmark.circle.fill", fallback: "checkmark-circle" },
  },
  moderate: {
    label: "Moderate",
    colorKey: "warning",
    icon: { sf: "flame.fill", fallback: "flame" },
  },
  hard: {
    label: "Hard",
    colorKey: "error",
    icon: { sf: "bolt.fill", fallback: "flash" },
  },
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
    <HapticPressable
      style={styles.toggleRow}
      onPress={() => onValueChange(!value)}
    >
      <SFIcon
        name={icon.sf}
        fallback={icon.fallback}
        size={20}
        color={iconColor}
      />
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

export function MapFilterDrawer({ navigation }: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
    selectedTrailDifficulties,
    toggleTrailDifficulty,
    clearTrailDifficulties,
  } = useMapFilters();

  const hasAnyFilter =
    selectedCategories.length > 0 ||
    showFollowingOnly ||
    !showTrails ||
    !showEvents ||
    (showTrails &&
      selectedTrailDifficulties.length > 0 &&
      selectedTrailDifficulties.length < ALL_DIFFICULTIES.length);

  const clearAll = () => {
    clearCategories();
    setShowFollowingOnly(false);
    setShowTrails(true);
    setShowEvents(true);
    clearTrailDifficulties();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 60 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasAnyFilter && (
          <HapticPressable onPress={clearAll}>
            <Text style={styles.clearAll}>Clear all</Text>
          </HapticPressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
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
            const catColor = colors.category[cat];
            return (
              <HapticPressable
                key={cat}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: catColor }
                    : {
                        backgroundColor: colors.background,
                        borderColor: colors.gray300,
                        borderWidth: 1,
                      },
                ]}
                onPress={() => toggleCategory(cat)}
              >
                <SFIcon
                  name={CATEGORY_ICONS[cat].sf}
                  fallback={CATEGORY_ICONS[cat].fallback}
                  size={16}
                  color={active ? "#FFFFFF" : catColor}
                />
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                >
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
            icon={{ sf: "person.2", fallback: "people" }}
            label="Following only"
            value={showFollowingOnly}
            onValueChange={setShowFollowingOnly}
            iconColor={showFollowingOnly ? colors.primary : colors.textMuted}
            colors={colors}
          />
          <View style={styles.toggleDivider} />
          <ToggleSwitchRow
            icon={{ sf: "calendar", fallback: "calendar" }}
            label="Show events"
            value={showEvents}
            onValueChange={setShowEvents}
            iconColor={showEvents ? colors.category.venue : colors.textMuted}
            colors={colors}
          />
          <View style={styles.toggleDivider} />
          <ToggleSwitchRow
            icon={{ sf: "figure.hiking", fallback: "walk" }}
            label="Show trails"
            value={showTrails}
            onValueChange={setShowTrails}
            iconColor={showTrails ? colors.category.park : colors.textMuted}
            colors={colors}
          />
          {showTrails &&
            ALL_DIFFICULTIES.map((diff, index) => {
              const active = selectedTrailDifficulties.includes(diff);
              const config = DIFFICULTY_CONFIG[diff];
              const diffColor = colors[config.colorKey];
              return (
                <React.Fragment key={diff}>
                  <HapticPressable
                    style={styles.difficultyRow}
                    onPress={() => toggleTrailDifficulty(diff)}
                  >
                    <SFIcon
                      name={active ? "checkmark.circle.fill" : "circle"}
                      fallback={active ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={active ? diffColor : colors.gray300}
                    />
                    <Text
                      style={[
                        styles.toggleLabel,
                        !active && { color: colors.textMuted },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </HapticPressable>
                </React.Fragment>
              );
            })}
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

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    clearAll: {
      fontSize: 14,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    scroll: {
      flex: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      fontFamily: fonts.bold,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 24,
    },
    clearText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginTop: 24,
      marginBottom: 8,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
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
      color: "#FFFFFF",
      fontFamily: fonts.semiBold,
    },
    toggleCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
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
    difficultyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
      paddingLeft: 46,
      gap: 12,
    },
    doneButton: {
      marginTop: 12,
    },
  });
