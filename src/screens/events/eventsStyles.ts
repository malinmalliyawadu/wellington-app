import { StyleSheet } from "react-native";
import { type Colors } from "../../theme/ThemeContext";
import { fonts } from "../../theme/fonts";

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    // Quick filter chips
    chipsRow: {
      flexGrow: 0,
    },
    chipsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.gray100,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: "#FFFFFF",
    },
    chipBadge: {
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    chipBadgeText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    // Carousel
    carouselContainer: {
      paddingHorizontal: 16,
      gap: 12,
    },
    carouselSpacing: {
      marginTop: 12,
    },
    // Filter summary
    filterSummaryRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterSummary: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: fonts.medium,
    },
    comingUpItemSpacing: {
      marginBottom: 20,
    },
    // View all button
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: colors.gray100,
    },
    viewAllText: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Empty state
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
    },
    emptyAction: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Footer
    footerContainer: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 8,
    },
    footerText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
  });

export type EventsStyles = ReturnType<typeof createStyles>;
