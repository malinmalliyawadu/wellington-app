import React, { useCallback, useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SFIcon } from "./SFIcon";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Event, Place } from "../types";
import { useFollow } from "../context/FollowContext";
import { getProfilesByIds } from "../services/users";
import { useQuery } from "../hooks/useQuery";
import { colors } from "../theme/colors";
import { HapticPressable } from "./HapticPressable";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";

interface EventCardProps {
  event: Event;
  place: Place;
  onPress?: () => void;
  hasBorder?: boolean;
  compact?: boolean;
}

export const CATEGORY_COLORS: Record<Event["category"], string> = {
  music: "#7209B7",
  comedy: "#F72585",
  art: "#4361EE",
  food: "#E85D04",
  market: "#2D6A4F",
  community: "#0077B6",
};

const CATEGORY_LABELS: Record<Event["category"], string> = {
  music: "Music",
  comedy: "Comedy",
  art: "Art",
  food: "Food & Drink",
  market: "Market",
  community: "Community",
};

function formatTime(time: string, endTime?: string): string {
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

function getMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NZ", { month: "short" }).toUpperCase();
}

function getDay(dateString: string): string {
  const date = new Date(dateString);
  return date.getDate().toString();
}

const AVATAR_SIZE = 22;
const AVATAR_OVERLAP = 6;
const glassEnabled = isLiquidGlassAvailable();

export function EventCard({
  event,
  place,
  onPress,
  hasBorder,
  compact,
}: EventCardProps) {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const categoryColor = CATEGORY_COLORS[event.category];
  const { followingIds } = useFollow();
  const attendeeIds = event.attendeeIds ?? [];

  const sortedAttendeeIds = useMemo(
    () =>
      [...attendeeIds].sort((a, b) => {
        const aFollowed = followingIds.includes(a);
        const bFollowed = followingIds.includes(b);
        if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
        return 0;
      }),
    [attendeeIds, followingIds]
  );

  const displayIds = sortedAttendeeIds.slice(0, 3);
  const fetchDisplayUsers = useCallback(
    () => getProfilesByIds(displayIds),
    [displayIds]
  );
  const { data: displayUsers } = useQuery(fetchDisplayUsers, displayIds);
  const displayAttendees = displayUsers ?? [];

  const totalCount = attendeeIds.length;
  const remainingCount = Math.max(0, totalCount - displayIds.length);

  return (
    <HapticPressable
      style={[
        styles.container,
        hasBorder ? { borderWidth: 1, borderColor: colors.border } : {},
      ]}
      onPress={onPress}
    >
      {/* Image area with overlays */}
      <View style={styles.imageContainer}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={[categoryColor, categoryColor + "88"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          />
        )}

        {/* Bottom gradient for title readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
          style={styles.imageGradient}
        />

        {/* Category badge (top-left) */}
        <View
          style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
        >
          <Text style={styles.categoryText}>
            {CATEGORY_LABELS[event.category]}
          </Text>
        </View>

        {/* Date badge (top-right) */}
        {glassEnabled ? (
          <GlassView glassEffectStyle="regular" style={styles.dateBadge}>
            <Text style={[styles.dateMonth, styles.dateMonthGlass]}>
              {getMonth(event.date)}
            </Text>
            <Text style={[styles.dateDay, styles.dateDayGlass]}>
              {getDay(event.date)}
            </Text>
          </GlassView>
        ) : (
          <View style={[styles.dateBadge, styles.dateBadgeFallback]}>
            <Text style={styles.dateMonth}>{getMonth(event.date)}</Text>
            <Text style={styles.dateDay}>{getDay(event.date)}</Text>
          </View>
        )}

        {/* Title overlaid on bottom */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
      </View>

      {/* Footer */}
      {compact ? (
        <View style={styles.footerCompact}>
          <View style={styles.footerInfoStacked}>
            <View style={styles.footerItem}>
              <SFIcon name="mappin" fallback="location" size={14} color={colors.textSecondary} />
              <Text style={styles.footerText} numberOfLines={1}>
                {place.name}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <SFIcon name="clock" fallback="time" size={14} color={colors.textSecondary} />
              <Text style={styles.footerText}>
                {formatTime(event.startTime, event.endTime)}
              </Text>
            </View>
          </View>
          {totalCount > 0 && (
            <View style={styles.attendeeSectionCompact}>
              <View style={styles.avatarStack}>
                {displayAttendees.map((user, index) => (
                  <Image
                    key={user.id}
                    source={{ uri: user.avatarUrl }}
                    style={[
                      styles.attendeeAvatar,
                      { marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP },
                      { zIndex: displayAttendees.length - index },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.attendeeCountCompact}>
                {totalCount} going
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <View style={styles.footerItem}>
              <SFIcon name="mappin" fallback="location" size={14} color={colors.textSecondary} />
              <Text style={styles.footerText} numberOfLines={1}>
                {place.name}
              </Text>
            </View>
            <View style={styles.footerDot} />
            <View style={styles.footerItem}>
              <SFIcon name="clock" fallback="time" size={14} color={colors.textSecondary} />
              <Text style={styles.footerText}>
                {formatTime(event.startTime, event.endTime)}
              </Text>
            </View>
          </View>
          {totalCount > 0 && (
            <View style={styles.attendeeSection}>
              <View style={styles.avatarStack}>
                {displayAttendees.map((user, index) => (
                  <Image
                    key={user.id}
                    source={{ uri: user.avatarUrl }}
                    style={[
                      styles.attendeeAvatar,
                      { marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP },
                      { zIndex: displayAttendees.length - index },
                    ]}
                  />
                ))}
              </View>
              {remainingCount > 0 && (
                <Text style={styles.attendeeCount}>+{remainingCount}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
  },
  imageContainer: {
    height: 220,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  // Category badge (top-left)
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Date badge (top-right)
  dateBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 48,
    overflow: "hidden",
  },
  dateBadgeFallback: {
    backgroundColor: "#FFFFFF",
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  dateMonthGlass: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateDay: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: colors.text,
    lineHeight: 24,
  },
  dateDayGlass: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Title overlaid on image
  title: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  footerInfoStacked: {
    flex: 1,
    gap: 4,
    marginRight: 8,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray400,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
  },
  attendeeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeeSectionCompact: {
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
  },
  attendeeAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.cardBackground,
    backgroundColor: colors.gray200,
  },
  attendeeCount: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.textSecondary,
    marginLeft: 4,
  },
  attendeeCountCompact: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.textSecondary,
    marginTop: 3,
  },
});
