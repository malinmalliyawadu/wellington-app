import { StyleSheet } from "react-native";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 100,
    },

    // ── Browse Sections ──────────────────────────────────────────────────

    section: {
      marginBottom: 28,
    },

    // Quick Categories
    categoryScrollContent: {
      paddingHorizontal: 16,
      gap: 10,
    },
    quickCategoryCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      gap: 8,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    quickCategoryLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },

    // Trending Hashtags
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 16,
      gap: 8,
    },
    trendingChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.gray100,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    trendingName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    trendingCount: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },

    // Popular Places - Horizontal Cards
    horizontalScrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    placeCard: {
      width: 240,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      overflow: "hidden",
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    placeCardAccent: {
      width: 4,
    },
    placeCardContent: {
      flex: 1,
      padding: 12,
    },
    placeCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    placeCardIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    placeCardCategory: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    placeCardName: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 2,
    },
    placeCardAddress: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginBottom: 8,
    },
    placeCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    placeCardStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    placeCardStatText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },

    // Guide Cards
    guideCardWrapper: {
      width: 200,
    },

    // ── Filter Chips ─────────────────────────────────────────────────────

    filterChipBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    filterChipText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },

    // ── Search Section Headers ───────────────────────────────────────────

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.gray100,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sectionHeaderText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionHeaderCount: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },

    // ── Search Results ───────────────────────────────────────────────────

    searchResults: {
      paddingBottom: 100,
    },
    resultItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    resultIconRect: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray200,
    },
    postThumbnail: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.gray200,
    },
    resultText: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 2,
    },
    resultSubtitle: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    resultTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    resultTrailing: {
      alignItems: "flex-end",
    },
    postMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    likeCount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    likeCountText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },

    // Category pill badge
    categoryPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    categoryPillText: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      letterSpacing: 0.3,
    },

    // Shimmer loading row
    shimmerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    shimmerTextCol: {
      flex: 1,
    },

    // ── Empty State ──────────────────────────────────────────────────────

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
