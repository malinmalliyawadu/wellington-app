import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { HapticPressable } from "./HapticPressable";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

interface SectionHeaderProps {
  title: string;
  icon?: unknown;
  count?: number;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}

export function SectionHeader({
  title,
  onSeeAll,
  seeAllLabel = "See all",
}: SectionHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
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
    title: {
      fontSize: 22,
      fontFamily: fonts.extraBold,
      color: colors.text,
    },
    seeAll: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
