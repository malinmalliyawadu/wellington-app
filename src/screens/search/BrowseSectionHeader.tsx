import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts } from "../../theme/fonts";
import { HapticPressable } from "../../components/HapticPressable";
import type { Colors } from "../../theme/ThemeContext";

export function BrowseSectionHeader({
  title,
  onSeeAll,
  colors,
}: {
  title: string;
  onSeeAll?: () => void;
  colors: Colors;
}) {
  return (
    <View style={browseSectionHeaderStyles(colors).container}>
      <Text style={browseSectionHeaderStyles(colors).title}>{title}</Text>
      {onSeeAll && (
        <HapticPressable onPress={onSeeAll}>
          <Text style={browseSectionHeaderStyles(colors).seeAll}>See All</Text>
        </HapticPressable>
      )}
    </View>
  );
}

const browseSectionHeaderStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    seeAll: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
