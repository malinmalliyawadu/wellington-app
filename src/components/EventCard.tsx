import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SFIcon } from "./SFIcon";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Event, Place } from "../types";
import { useFollow } from "../context/FollowContext";
import { getProfilesByIds } from "../services/users";
import { useQuery } from "../hooks/useQuery";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { HapticPressable } from "./HapticPressable";
import { fonts } from "../theme/fonts";

type EventCardVariant = "default" | "featured" | "small";

interface EventCardProps {
  event: Event;
  place: Place;
  onPress?: () => void;
  hasBorder?: boolean;
  compact?: boolean;
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
};

const CATEGORY_LABELS: Record<Event["category"], string> = {
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
  return date.toLocaleDateString("en-NZ", { month: "short", timeZone: "Pacific/Auckland" }).toUpperCase();
}

function getDay(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-NZ", { day: "numeric", timeZone: "Pacific/Auckland" });
}

function getRelativeDay(dateString: string): string {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });
  const [y, m, d] = todayStr.split("-").map(Number);
  const today = new Date(y, m - 1, d);
  const [ey, em, ed] = dateString.split("-").map(Number);
  const eventDate = new Date(ey, em - 1, ed);
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    const dayName = new Date(dateString + "T00:00:00").toLocaleDateString("en-NZ", {
      weekday: "long",
      timeZone: "Pacific/Auckland",
    });
    return dayName;
  }
  return `In ${diffDays} days`;
}

function isEventHappeningNow(event: Event): boolean {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });
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
  const endMinutes = event.endTime ? toMinutes(event.endTime) : startMinutes + 180;
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
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
  variant = "default",
}: EventCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const categoryColor = CATEGORY_COLORS[event.category];
  const happeningNow = useMemo(() => isEventHappeningNow(event), [event]);
  const relativeDay = useMemo(() => getRelativeDay(event.date), [event.date]);
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

  // --- Small variant ---
  if (variant === "small") {
    return (
      <HapticPressable style={styles.smallContainer} onPress={onPress}>
        <View style={styles.smallImageContainer}>
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={[categoryColor, categoryColor + "88"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.image}
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradient}
          />
          <View
            style={[
              styles.smallCategoryBadge,
              { backgroundColor: categoryColor },
            ]}
          >
            <Text style={styles.smallCategoryText}>
              {CATEGORY_LABELS[event.category]}
            </Text>
          </View>
          {event.price == null || event.price === 0 ? (
            <View style={styles.smallFreeBadge}>
              <Text style={styles.smallFreeText}>Free</Text>
            </View>
          ) : null}
          <Text style={styles.smallTitle} numberOfLines={2}>
            {event.title}
          </Text>
        </View>
        <View style={styles.smallFooter}>
          <View style={styles.footerItem}>
            <SFIcon
              name="mappin"
              fallback="location"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.smallFooterText} numberOfLines={1}>
              {place.name}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <SFIcon
              name="clock"
              fallback="time"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.smallFooterText}>
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
      <HapticPressable style={styles.featuredContainer} onPress={onPress}>
        <View style={styles.featuredImageContainer}>
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={[categoryColor, categoryColor + "88"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.image}
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradient}
          />
          <View
            style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
          >
            <Text style={styles.categoryText}>
              {CATEGORY_LABELS[event.category]}
            </Text>
          </View>
          {event.price != null && event.price > 0 ? (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>${event.price.toFixed(0)}</Text>
            </View>
          ) : (
            <View style={[styles.priceBadge, styles.freeBadge]}>
              <Text style={[styles.priceText, styles.freeText]}>Free</Text>
            </View>
          )}
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
          {totalCount > 0 && (
            <View style={styles.featuredAttendeeBadge}>
              <SFIcon
                name="person.2.fill"
                fallback="people"
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.featuredAttendeeText}>
                {totalCount} going
              </Text>
            </View>
          )}
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {event.title}
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <View style={styles.footerItem}>
              <SFIcon
                name="mappin"
                fallback="location"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.footerText} numberOfLines={1}>
                {place.name}
              </Text>
            </View>
            <View style={styles.footerDot} />
            {happeningNow ? (
              <View style={styles.footerItem}>
                <View style={styles.nowDotLarge} />
                <Text style={styles.nowFooterText}>Happening now</Text>
              </View>
            ) : (
              <View style={styles.footerItem}>
                <SFIcon
                  name="clock"
                  fallback="time"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.footerText}>
                  {formatTime(event.startTime, event.endTime)}
                </Text>
              </View>
            )}
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
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </View>
              {remainingCount > 0 && (
                <Text style={styles.attendeeCount}>+{remainingCount}</Text>
              )}
            </View>
          )}
        </View>
      </HapticPressable>
    );
  }

  // --- Default variant ---
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
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
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

        {/* Price badge (below category) */}
        {event.price != null && event.price > 0 ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>${event.price.toFixed(0)}</Text>
          </View>
        ) : (
          <View style={[styles.priceBadge, styles.freeBadge]}>
            <Text style={[styles.priceText, styles.freeText]}>Free</Text>
          </View>
        )}

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
              <SFIcon
                name="mappin"
                fallback="location"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.footerText} numberOfLines={1}>
                {place.name}
              </Text>
            </View>
            {happeningNow ? (
              <View style={styles.footerItem}>
                <View style={styles.nowDotLarge} />
                <Text style={styles.nowFooterText}>Happening now</Text>
              </View>
            ) : (
              <View style={styles.footerItem}>
                <SFIcon
                  name="clock"
                  fallback="time"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.footerText}>
                  {formatTime(event.startTime, event.endTime)}
                </Text>
              </View>
            )}
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
                    contentFit="cover"
                    transition={200}
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
              <SFIcon
                name="mappin"
                fallback="location"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.footerText} numberOfLines={1}>
                {place.name}
              </Text>
            </View>
            <View style={styles.footerDot} />
            {happeningNow ? (
              <View style={styles.footerItem}>
                <View style={styles.nowDotLarge} />
                <Text style={styles.nowFooterText}>Happening now</Text>
              </View>
            ) : (
              <View style={styles.footerItem}>
                <SFIcon
                  name="clock"
                  fallback="time"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.footerText}>
                  {formatTime(event.startTime, event.endTime)}
                </Text>
              </View>
            )}
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
                    contentFit="cover"
                    transition={200}
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

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
      borderRadius: 100,
    },
    categoryText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
      fontFamily: fonts.bold,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    priceBadge: {
      position: "absolute",
      top: 42,
      left: 12,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
    },
    freeBadge: {
      backgroundColor: "#059669",
    },
    priceText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
      fontFamily: fonts.bold,
    },
    freeText: {
      color: "#FFFFFF",
    },
    // Date badge (top-right)
    dateBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: "center",
      minWidth: 48,
      overflow: "hidden",
    },
    dateBadgeFallback: {
      backgroundColor: colors.cardBackground,
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
    // Title overlaid on image
    title: {
      position: "absolute",
      bottom: 14,
      left: 14,
      right: 14,
      fontSize: 20,
      fontFamily: fonts.bold,
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
      fontFamily: fonts.medium,
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
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    attendeeCountCompact: {
      fontSize: 11,
      fontWeight: "600",
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      marginTop: 3,
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
    featuredTitle: {
      position: "absolute",
      bottom: 16,
      left: 18,
      right: 18,
      fontSize: 24,
      fontFamily: fonts.extraBold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    featuredAttendeeBadge: {
      position: "absolute",
      bottom: 56,
      left: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 100,
    },
    featuredAttendeeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontFamily: fonts.semiBold,
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
    smallCategoryBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 100,
    },
    smallCategoryText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
      textTransform: "uppercase",
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
    smallTitle: {
      position: "absolute",
      bottom: 10,
      left: 12,
      right: 12,
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    smallFooter: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 3,
    },
    smallFooterText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fonts.medium,
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
