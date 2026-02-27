import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import type { SFSymbol } from "expo-symbols";
import type { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  title: string;
  icon?: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
  count?: number;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}

export function SectionHeader({
  title,
  icon,
  count,
  onSeeAll,
  seeAllLabel = "See all",
}: SectionHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && (
          <SFIcon
            name={icon.sf}
            fallback={icon.fallback}
            size={18}
            color={colors.primary}
          />
        )}
        <Text style={styles.title}>{title}</Text>
        {count != null && count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <HapticPressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>{seeAllLabel}</Text>
        </HapticPressable>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 12,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    countBadge: {
      backgroundColor: colors.gray100,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    countText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    seeAll: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
