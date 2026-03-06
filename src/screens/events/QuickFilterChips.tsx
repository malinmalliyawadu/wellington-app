import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import { QUICK_CHIPS } from "./eventsHelpers";
import type { EventsStyles } from "./eventsStyles";
import type { Colors } from "../../theme/ThemeContext";

interface QuickFilterChipsProps {
  isChipActive: (key: string) => boolean;
  onChipPress: (key: string) => void;
  advancedFilterCount: number;
  styles: EventsStyles;
  colors: Colors;
}

export function QuickFilterChips({
  isChipActive,
  onChipPress,
  advancedFilterCount,
  styles,
  colors,
}: QuickFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContainer}
      style={styles.chipsRow}
    >
      {QUICK_CHIPS.map((chip) => {
        const active = isChipActive(chip.key);
        return (
          <HapticPressable
            key={chip.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChipPress(chip.key)}
          >
            <SFIcon
              name={chip.icon.sf}
              fallback={chip.icon.fallback}
              size={14}
              color={active ? "#FFFFFF" : colors.textSecondary}
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {chip.label}
            </Text>
            {chip.key === "filters" && advancedFilterCount > 0 && (
              <View style={styles.chipBadge}>
                <Text style={styles.chipBadgeText}>
                  {advancedFilterCount}
                </Text>
              </View>
            )}
          </HapticPressable>
        );
      })}
    </ScrollView>
  );
}
