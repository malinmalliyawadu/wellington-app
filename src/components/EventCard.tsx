import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Event, Place, User } from "../types";
import { useFollow } from "../context/FollowContext";
import { getProfilesByIds } from "../services/users";
import { useQuery } from "../hooks/useQuery";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { HapticPressable } from "./HapticPressable";
import { fonts } from "../theme/fonts";
import { SFIcon } from "./SFIcon";
import { SFSymbol } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";

type EventCardVariant = "default" | "featured" | "small";

interface EventCardProps {
  event: Event;
  place: Place;
  onPress?: () => void;
  onEventPress?: (eventId: string) => void;
  attendeeProfiles?: User[];
  variant?: EventCardVariant;
}

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

const EVENT_CATEGORY_ICONS: Record<
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
  const date = new Date(dateString + "T00:00:00");
  return date
    .toLocaleDateString("en-NZ", {
      month: "short",
      timeZone: "Pacific/Auckland",
    })
    .toUpperCase();
}

function getDay(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

function getRelativeDay(dateString: string): string {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", {
    timeZone: "Pacific/Auckland",
  });
  const [y, m, d] = todayStr.split("-").map(Number);
  const today = new Date(y, m - 1, d);
  const [ey, em, ed] = dateString.split("-").map(Number);
  const eventDate = new Date(ey, em - 1, ed);
  const diffDays = Math.round(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    const dayName = new Date(dateString + "T00:00:00").toLocaleDateString(
      "en-NZ",
      {
        weekday: "long",
        timeZone: "Pacific/Auckland",
      }
    );
    return dayName;
  }
  return `In ${diffDays} days`;
}

function isEventHappeningNow(event: Event): boolean {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", {
    timeZone: "Pacific/Auckland",
  });
  if (event.date !== todayStr) return false;
  const nzTimeStr = now.toLocaleTimeString("en-GB", {
    timeZone: "Pacific/Auckland",
    hour12: false,
  });
  const [nowH, nowM] = nzTimeStr.split(":").map(Number);
  const nowMinutes = nowH * 60 + nowM;
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const startMinutes = toMinutes(event.startTime);
  const endMinutes = event.endTime
    ? toMinutes(event.endTime)
    : startMinutes + 180;
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

const AVATAR_SIZE = 22;
const AVATAR_OVERLAP = 6;
const glassEnabled = isLiquidGlassAvailable();

function NoImagePlaceholder({
  category,
  categoryColor,
  size = "default",
}: {
  category: Event["category"];
  categoryColor: string;
  size?: "default" | "small";
}) {
  const icon = EVENT_CATEGORY_ICONS[category];
  const label = CATEGORY_LABELS[category];
  const iconSize = size === "small" ? 36 : 56;

  return (
    <LinearGradient
      colors={[categoryColor + "CC", categoryColor, categoryColor + "99"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={placeholderStyles.container}
    >
      {/* Decorative large faded icon in background */}
      <View style={placeholderStyles.bgIconContainer}>
        <SFIcon
          name={icon.sf}
          fallback={icon.fallback}
          size={size === "small" ? 80 : 120}
          color="rgba(255,255,255,0.08)"
        />
      </View>
      {/* Centered icon + label */}
      <View style={placeholderStyles.content}>
        <View
          style={[
            placeholderStyles.iconCircle,
            size === "small" && placeholderStyles.iconCircleSmall,
          ]}
        >
          <SFIcon
            name={icon.sf}
            fallback={icon.fallback}
            size={iconSize}
            color="#FFFFFF"
          />
        </View>
        <Text
          style={[
            placeholderStyles.label,
            size === "small" && placeholderStyles.labelSmall,
          ]}
        >
          {label}
        </Text>
      </View>
    </LinearGradient>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  bgIconContainer: {
    position: "absolute",
    top: -10,
    right: -10,
    opacity: 1,
    transform: [{ rotate: "15deg" }],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconCircleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  labelSmall: {
    fontSize: 10,
  },
});

export const EventCard = React.memo(function EventCard({
  event,
  place,
  onPress,
  onEventPress,
  attendeeProfiles,
  variant = "default",
}: EventCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categoryColor = CATEGORY_COLORS[event.category];
  const happeningNow = useMemo(() => isEventHappeningNow(event), [event]);
  const relativeDay = useMemo(() => getRelativeDay(event.date), [event.date]);
  const [imageError, setImageError] = useState(false);
  const showImage = !!event.imageUrl && !imageError;
  const { followingIds } = useFollow();
  const attendeeIds = useMemo(
    () => event.attendeeIds ?? [],
    [event.attendeeIds]
  );

  const handlePress = useCallback(() => {
    if (onEventPress) {
      onEventPress(event.id);
    } else if (onPress) {
      onPress();
    }
  }, [onEventPress, onPress, event.id]);

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

  // Use pre-fetched profiles if provided, otherwise fetch per-card
  const fetchDisplayUsers = useCallback(
    () => getProfilesByIds(displayIds),
    [displayIds]
  );
  const { data: fetchedUsers } = useQuery(fetchDisplayUsers, displayIds, {
    enabled: !attendeeProfiles,
  });

  const displayAttendees = useMemo(() => {
    if (attendeeProfiles) {
      const idSet = new Set(displayIds);
      return attendeeProfiles.filter((u) => idSet.has(u.id));
    }
    return fetchedUsers ?? [];
  }, [attendeeProfiles, displayIds, fetchedUsers]);

  const totalCount = attendeeIds.length;
  const remainingCount = Math.max(0, totalCount - displayIds.length);

  // --- Small variant ---
  if (variant === "small") {
    return (
      <HapticPressable style={styles.smallContainer} onPress={handlePress}>
        <View style={styles.smallImageContainer}>
          {showImage ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <NoImagePlaceholder
              category={event.category}
              categoryColor={categoryColor}
              size="small"
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradient}
          />
          {event.price == null || event.price === 0 ? (
            <View style={styles.smallFreeBadge}>
              <Text style={styles.smallFreeText}>Free</Text>
            </View>
          ) : null}
          <View style={styles.smallOverlayBottom}>
            <Text style={styles.smallTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.smallOverlayPlace} numberOfLines={1}>
              {place.name}
            </Text>
            <Text style={styles.smallOverlayTime}>
              {relativeDay === "Today"
                ? formatTime(event.startTime)
                : `${relativeDay} · ${formatTime(event.startTime)}`}
            </Text>
          </View>
        </View>
      </HapticPressable>
    );
  }

  // --- Featured variant ---
  if (variant === "featured") {
    return (
      <HapticPressable style={styles.featuredContainer} onPress={handlePress}>
        <View style={styles.featuredImageContainer}>
          {showImage ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <NoImagePlaceholder
              category={event.category}
              categoryColor={categoryColor}
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradient}
          />
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
          <View style={styles.featuredOverlayBottom}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.overlayFooter}>
              <View style={styles.overlayInfo}>
                <Text style={styles.overlayPlaceName} numberOfLines={1}>
                  {place.name}
                </Text>
                {happeningNow ? (
                  <View style={styles.overlayMetaItem}>
                    <View style={styles.nowDotLarge} />
                    <Text style={styles.overlayNowText}>Happening now</Text>
                  </View>
                ) : (
                  <Text style={styles.overlayMeta}>
                    {formatTime(event.startTime, event.endTime)}
                  </Text>
                )}
              </View>
              {totalCount > 0 && (
                <View style={styles.overlayAttendees}>
                  <View style={styles.avatarStack}>
                    {displayAttendees.map((user, index) => (
                      <Image
                        key={user.id}
                        source={{ uri: user.avatarUrl }}
                        style={[
                          styles.overlayAvatar,
                          { marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP },
                          { zIndex: displayAttendees.length - index },
                        ]}
                        contentFit="cover"
                        transition={200}
                      />
                    ))}
                  </View>
                  {remainingCount > 0 && (
                    <Text style={styles.overlayAttendeeCount}>
                      +{remainingCount}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </HapticPressable>
    );
  }

  // --- Default variant ---
  return (
    <HapticPressable
      style={styles.container}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        {showImage ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <NoImagePlaceholder
            category={event.category}
            categoryColor={categoryColor}
          />
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={styles.imageGradient}
        />

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

        {/* Bottom content overlaid on image */}
        <View style={styles.overlayBottom}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.overlayFooter}>
            <View style={styles.overlayInfo}>
              <Text style={styles.overlayPlaceName} numberOfLines={1}>
                {place.name}
              </Text>
              {happeningNow ? (
                <View style={styles.overlayMetaItem}>
                  <View style={styles.nowDotLarge} />
                  <Text style={styles.overlayNowText}>Happening now</Text>
                </View>
              ) : (
                <Text style={styles.overlayMeta}>
                  {formatTime(event.startTime, event.endTime)}
                </Text>
              )}
            </View>
            {totalCount > 0 && (
              <View style={styles.overlayAttendees}>
                <View style={styles.avatarStack}>
                  {displayAttendees.map((user, index) => (
                    <Image
                      key={user.id}
                      source={{ uri: user.avatarUrl }}
                      style={[
                        styles.overlayAvatar,
                        { marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP },
                        { zIndex: displayAttendees.length - index },
                      ]}
                      contentFit="cover"
                      transition={200}
                    />
                  ))}
                </View>
                {remainingCount > 0 && (
                  <Text style={styles.overlayAttendeeCount}>
                    +{remainingCount}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </HapticPressable>
  );
});

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      borderRadius: 24,
      marginHorizontal: 16,
      overflow: "hidden",
    },
    imageContainer: {
      height: 280,
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
      height: "70%",
    },
    // Date badge (top-right)
    dateBadge: {
      position: "absolute",
      top: 14,
      right: 14,
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: "center",
      minWidth: 48,
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    dateBadgeFallback: {
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    dateMonth: {
      fontSize: 10,
      fontWeight: "700",
      fontFamily: fonts.bold,
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
      fontFamily: fonts.extraBold,
      color: colors.text,
      lineHeight: 24,
    },
    dateDayGlass: {
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    // Overlay bottom content
    overlayBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
    },
    title: {
      fontSize: 22,
      fontFamily: fonts.extraBold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
      marginBottom: 8,
    },
    overlayFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    overlayInfo: {
      flex: 1,
      marginRight: 8,
    },
    overlayPlaceName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: "rgba(255,255,255,0.9)",
    },
    overlayMeta: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: "rgba(255,255,255,0.7)",
      marginTop: 2,
    },
    overlayMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    overlayNowText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: "#34C759",
    },
    overlayAttendees: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarStack: {
      flexDirection: "row",
    },
    overlayAvatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.5)",
      backgroundColor: colors.gray200,
    },
    overlayAttendeeCount: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: "rgba(255,255,255,0.8)",
      marginLeft: 4,
    },
    // --- Featured variant styles ---
    featuredContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      marginHorizontal: 16,
      overflow: "hidden",
    },
    featuredImageContainer: {
      height: 280,
      position: "relative",
    },
    featuredOverlayBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 18,
    },
    featuredTitle: {
      fontSize: 24,
      fontFamily: fonts.extraBold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
      marginBottom: 8,
    },
    // --- Small variant styles ---
    smallContainer: {
      width: 160,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      overflow: "hidden",
    },
    smallImageContainer: {
      height: 180,
      position: "relative",
    },
    smallFreeBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "#059669",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 100,
    },
    smallFreeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
      fontFamily: fonts.bold,
    },
    smallOverlayBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
    },
    smallTitle: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      marginBottom: 4,
    },
    smallOverlayPlace: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: "rgba(255,255,255,0.85)",
    },
    smallOverlayTime: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: "rgba(255,255,255,0.65)",
      marginTop: 1,
    },
    nowDotLarge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#34C759",
    },
    nowFooterText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: "#34C759",
    },
  });
