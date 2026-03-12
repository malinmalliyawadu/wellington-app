import { StyleSheet } from "react-native";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";
import type { PlaceCategory } from "../../types";

export const CATEGORY_ICONS: Record<PlaceCategory, { sf: string; fallback: string }> =
  {
    cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
    restaurant: { sf: "fork.knife", fallback: "restaurant" },
    bar: { sf: "wineglass.fill", fallback: "wine" },
    attraction: { sf: "safari", fallback: "compass" },
    park: { sf: "leaf.fill", fallback: "leaf" },
    venue: { sf: "music.note.list", fallback: "musical-notes" },
    trail: { sf: "figure.hiking", fallback: "walk" },
    shop: { sf: "bag.fill", fallback: "bag" },
  };

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heroContainer: {
      height: 260,
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.gray200,
    },
    heroGradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "60%",
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
    },
    title: {
      fontSize: 24,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 8,
    },
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    creatorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    creatorAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.gray200,
    },
    creatorAvatarFallback: {
      justifyContent: "center",
      alignItems: "center",
    },
    creatorName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    stat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    statText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    ownerActions: {
      flexDirection: "row",
      marginTop: 16,
    },
    placeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.gray200,
      gap: 12,
    },
    placeNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      justifyContent: "center",
      alignItems: "center",
    },
    placeNumberText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    placeThumbnail: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.gray200,
    },
    placeCategoryDot: {
      width: 48,
      height: 48,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    placeInfo: {
      flex: 1,
    },
    placeName: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    placeAddress: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    placeNote: {
      fontSize: 13,
      color: colors.primary,
      fontStyle: "italic",
      marginTop: 4,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
    },
    // Comments
    commentsSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.gray200,
      paddingTop: 16,
    },
    commentsSectionTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    commentRow: {
      flexDirection: "row",
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    commentAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.gray200,
      marginRight: 10,
    },
    commentContent: {
      flex: 1,
    },
    commentText: {
      fontSize: 13,
      lineHeight: 18,
    },
    commentAuthor: {
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    commentTime: {
      fontSize: 12,
      color: colors.textMuted,
    },
    commentBody: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 19,
      marginTop: 2,
    },
    commentActions: {
      flexDirection: "row",
      gap: 16,
      marginTop: 4,
    },
    commentActionText: {
      fontSize: 12,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },
    // Comment input bar
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.gray200,
      backgroundColor: colors.background,
    },
    commentInput: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.gray100,
      paddingHorizontal: 16,
      fontSize: 14,
      color: colors.text,
    },
    cancelButton: {
      marginRight: 8,
      padding: 4,
    },
    sendButton: {
      marginLeft: 8,
      padding: 4,
    },
  });
