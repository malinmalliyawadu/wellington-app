import { StyleSheet } from "react-native";
import type { SFSymbol } from "expo-symbols";
import type { Ionicons } from "@expo/vector-icons";

import type { Colors } from "../../theme/ThemeContext";
import type { Event } from "../../types";
import { fonts } from "../../theme/fonts";

export const CATEGORY_COLORS: Record<Event["category"], string> = {
  music: "#7209B7",
  comedy: "#F72585",
  art: "#4361EE",
  food: "#E85D04",
  market: "#2D6A4F",
  community: "#0077B6",
  quiz: "#6D28D9",
  craft: "#D97706",
  kids: "#059669",
  cultural: "#B91C1C",
  volunteering: "#16A34A",
};

export const CATEGORY_LABELS: Record<Event["category"], string> = {
  music: "Music",
  comedy: "Comedy",
  art: "Art",
  food: "Food & Drink",
  market: "Market",
  community: "Community",
  quiz: "Quiz",
  craft: "Craft",
  kids: "Kids",
  cultural: "Cultural",
  volunteering: "Volunteering",
};

export const EVENT_CATEGORY_ICONS: Record<
  Event["category"],
  { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }
> = {
  music: { sf: "music.note.list", fallback: "musical-notes" },
  comedy: { sf: "face.smiling", fallback: "happy" },
  art: { sf: "paintpalette.fill", fallback: "color-palette" },
  food: { sf: "fork.knife", fallback: "restaurant" },
  market: { sf: "cart.fill", fallback: "cart" },
  community: { sf: "person.2", fallback: "people" },
  quiz: { sf: "questionmark.circle", fallback: "help-circle" },
  craft: { sf: "scissors", fallback: "cut" },
  kids: { sf: "figure.and.child.holdinghands", fallback: "happy" },
  cultural: { sf: "building.columns", fallback: "globe" },
  volunteering: { sf: "hands.sparkles.fill", fallback: "heart" },
};

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  };
  return date.toLocaleDateString("en-NZ", options);
}

export function formatTime(time: string, endTime?: string): string {
  const formatSingleTime = (t: string) => {
    const [hours, minutes] = t.split(":");
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}${minutes !== "00" ? `:${minutes}` : ""}${suffix}`;
  };

  if (endTime) {
    return `${formatSingleTime(time)} – ${formatSingleTime(endTime)}`;
  }
  return formatSingleTime(time);
}

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Hero image area with overlays
    heroContainer: {
      height: 280,
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
      height: "65%",
    },
    heroOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
    },
    heroPills: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    heroPill: {
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    heroPillText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
    },
    heroPillDot: {
      fontSize: 16,
      color: "rgba(255,255,255,0.7)",
    },
    heroTitle: {
      fontSize: 26,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    // Meta info (date/time, location)
    metaSection: {
      padding: 20,
      gap: 16,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    metaPrimary: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    metaSecondary: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metaLink: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
    },
    directionsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    directionsText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    mapSection: {
      padding: 20,
      gap: 8,
    },
    mapContainer: {
      borderRadius: 12,
      overflow: "hidden",
    },
    miniMap: {
      height: 180,
    },
    mapPlaceName: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    mapAddress: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.gray200,
      marginHorizontal: 20,
    },
    // CTA buttons
    ctaSection: {
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 10,
    },
    // Utility icon row
    utilityRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 32,
      paddingVertical: 16,
    },
    utilityItem: {
      alignItems: "center",
      gap: 4,
    },
    utilityLabel: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    // About section
    aboutSection: {
      padding: 20,
      gap: 12,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    attendeesHeader: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.gray200,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    attendeeCount: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: fonts.medium,
    },
    attendeeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.gray200,
    },
    attendeeRowPressed: {
      backgroundColor: colors.gray100,
    },
    attendeeAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.gray200,
      marginRight: 12,
    },
    attendeeName: {
      fontSize: 15,
      fontWeight: "500",
      fontFamily: fonts.medium,
      color: colors.text,
      flex: 1,
    },
    followBadge: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    followBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
    },
  });

export const createMarkdownStyles = (colors: Colors) =>
  StyleSheet.create({
    body: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    heading1: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 18,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginTop: 16,
      marginBottom: 4,
    },
    strong: {
      fontFamily: fonts.bold,
    },
    em: {
      fontStyle: "italic",
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 14,
    },
  });
