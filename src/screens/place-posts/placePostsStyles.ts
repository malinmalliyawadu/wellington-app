import { StyleSheet } from "react-native";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";
import type { PlaceCategory, TrailDifficulty } from "../../types";

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  bar: "Bar",
  attraction: "Attraction",
  park: "Park",
  venue: "Venue",
  trail: "Trail",
  shop: "Shop",
};

export const DIFFICULTY_LABELS: Record<TrailDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    blurContainer: {
      flex: 1,
      overflow: "hidden",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      paddingTop: 100,
    },
    header: {
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    headerContent: {
      paddingTop: 24,
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: "transparent",
    },
    headerContentScrolled: {
      backgroundColor: colors.background,
    },
    nameButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    name: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
      flexShrink: 1,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.4)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    categoryText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginRight: 8,
    },
    ratingText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    reviewCountText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    address: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    stat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.gray200,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    directionsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginLeft: "auto",
    },
    directionsText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Trail header styles
    trailTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    trailIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    trailhead: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 1,
    },
    trailStatsRow: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 10,
    },
    trailStatCard: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: "center",
      gap: 3,
      borderWidth: 1,
    },
    trailStatValue: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    trailStatLabel: {
      fontSize: 10,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    trailDifficultyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 8,
    },
    trailDifficultyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    trailActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    eventsSection: {
      paddingBottom: 8,
      gap: 8,
    },
    eventsSectionHeader: {
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    eventsSectionTitle: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    postList: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    postRow: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 0,
      marginVertical: 4,
      marginHorizontal: 8,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.gray200,
      marginRight: 10,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    postContent: {
      flex: 1,
      marginRight: 8,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    displayName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginRight: 6,
    },
    followBadge: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.primary + "40",
    },
    followBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    postText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    postMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 4,
    },
    likesText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    thumbnail: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.gray200,
      borderWidth: 1.5,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: "transparent",
      margin: 16,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginTop: 12,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 20,
    },
    listCreateButton: {
      marginTop: 12,
      marginBottom: 16,
    },
  });
