import { StyleSheet } from "react-native";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";
import type { TrailDifficulty } from "../../types";

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
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    header: {
      paddingTop: 24,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    titleText: {
      flex: 1,
    },
    name: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    trailhead: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
    },
    statValue: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    difficultyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    difficultyText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
    },
    trailActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginLeft: "auto",
    },
    directionsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    directionsText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    engagementRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    engagementStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    engagementText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    // Events section
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
    // Posts section
    postsSection: {
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 8,
    },
    postsCarousel: {
      paddingHorizontal: 16,
      gap: 10,
    },
    postCard: {
      width: 140,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      overflow: "hidden",
    },
    postCardImage: {
      width: 140,
      height: 100,
      backgroundColor: colors.gray200,
    },
    postCardTextPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    postCardBody: {
      padding: 8,
    },
    postCardUserRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    postCardAvatar: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.gray200,
      marginRight: 4,
    },
    postCardUsername: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      color: colors.text,
      flex: 1,
    },
    postCardCaption: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
      marginBottom: 4,
    },
    postCardLikeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    postCardLikeCount: {
      fontSize: 10,
      color: colors.textMuted,
    },
    createButtonContainer: {
      marginTop: 12,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    // Empty state
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
    // Existing sections
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    highlightRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 6,
    },
    highlightText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
  });
