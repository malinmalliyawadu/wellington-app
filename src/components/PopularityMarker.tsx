import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { fonts } from "../theme/fonts";
import { PlaceCategory } from "../types";
import { SFIcon } from "./SFIcon";
import { useTheme, type Colors } from "../theme/ThemeContext";

const glassEnabled = isLiquidGlassAvailable();

export const CATEGORY_ICONS: Record<
  PlaceCategory,
  { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }
> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
  shop: { sf: "bag.fill", fallback: "bag" },
};

export interface MarkerEvent {
  date: string;
  startTime: string;
  endTime?: string;
  isHappeningNow: boolean;
  attendeeAvatars: string[];
}

interface PopularityMarkerProps {
  size: number;
  category: PlaceCategory;
  postCount: number;
  isFollowed: boolean;
  placeName?: string;
  posterAvatars?: string[];
  showLabel?: boolean;
  events?: MarkerEvent[];
}

function PopularityMarkerInner({
  size,
  category,
  isFollowed,
  placeName,
  posterAvatars = [],
  showLabel = false,
  events = [],
}: PopularityMarkerProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const hasEvents = events.length > 0;
  const shouldShowLabel = showLabel || hasEvents;
  const color = colors.category[category];
  const iconSize = Math.round(size * 0.45);
  const iconName = CATEGORY_ICONS[category];
  const unfollowedIconColor = isDark ? "#E8E8E8aa" : color;

  const renderMarker = () => {
    if (glassEnabled) {
      // Followed — solid vibrant color (glass washes it out)
      if (isFollowed) {
        return (
          <GlassView
            style={[
              styles.followedGlassMarker,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
            glassEffectStyle="clear"
          >
            <SFIcon
              name={iconName.sf}
              fallback={iconName.fallback}
              size={iconSize}
              color="#FFFFFF"
            />
          </GlassView>
        );
      }

      // Unfollowed — muted glass with category color
      return (
        <GlassView
          style={[
            styles.glassMarker,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color + "44",
            },
          ]}
          glassEffectStyle="clear"
        >
          <SFIcon
            name={iconName.sf}
            fallback={iconName.fallback}
            size={iconSize}
            color={unfollowedIconColor}
          />
        </GlassView>
      );
    }

    // --- Fallback path (no liquid glass) ---
    if (isFollowed) {
      return (
        <View
          style={[
            styles.markerContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.marker,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: color,
                  opacity: 0.85,
                  borderRadius: size / 2,
                },
              ]}
            />
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.4)",
                "rgba(255, 255, 255, 0)",
                "rgba(0, 0, 0, 0.15)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            />
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.7 }}
              style={[
                styles.highlight,
                {
                  width: size * 0.6,
                  height: size * 0.6,
                  borderRadius: (size * 0.6) / 2,
                },
              ]}
            />
            <SFIcon
              name={iconName.sf}
              fallback={iconName.fallback}
              size={iconSize}
              color="#FFFFFF"
              style={{ zIndex: 10 }}
            />
          </BlurView>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.markerContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.blurMarker,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(30, 30, 30, 0.6)"
                  : "rgba(255, 255, 255, 0.4)",
                borderRadius: size / 2,
                borderWidth: 2.5,
                borderColor: color,
              },
            ]}
          />
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 0)",
              "rgba(0, 0, 0, 0.1)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={[
              styles.highlight,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: (size * 0.5) / 2,
              },
            ]}
          />
          <SFIcon
            name={iconName.sf}
            fallback={iconName.fallback}
            size={iconSize}
            color={unfollowedIconColor}
            style={{ zIndex: 10 }}
          />
        </BlurView>
      </View>
    );
  };

  const formatMarkerTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const suffix = h >= 12 ? "pm" : "am";
    return m === 0
      ? `${hour12}${suffix}`
      : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
  };

  const renderLabelContent = () => (
    <>
      {hasEvents ? (
        <View style={styles.eventColumn}>
          {placeName && (
            <Text style={styles.labelName} numberOfLines={1}>
              {placeName}
            </Text>
          )}
          <View style={styles.eventTimeBadge}>
            {events[0].isHappeningNow && <View style={styles.nowDot} />}
            <Text
              style={[
                styles.eventTime,
                events[0].isHappeningNow && styles.eventTimeNow,
              ]}
            >
              {formatMarkerTime(events[0].startTime)}
            </Text>
          </View>
          {events[0].attendeeAvatars.length > 0 && (
            <View style={styles.avatarRow}>
              <View style={styles.avatarStack}>
                {events[0].attendeeAvatars.slice(0, 8).map((avatarUrl, i) => (
                  <Image
                    key={`${avatarUrl}-${i}`}
                    source={{ uri: avatarUrl }}
                    style={[styles.avatar, { left: i * 10 }]}
                    contentFit="cover"
                    transition={0}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <>
          {placeName && (
            <Text style={styles.labelName} numberOfLines={1}>
              {placeName}
            </Text>
          )}
          {posterAvatars.length > 1 && (
            <View style={styles.avatarRow}>
              <View style={styles.avatarStack}>
                {posterAvatars.slice(0, 8).map((avatarUrl, i) => (
                  <Image
                    key={`${avatarUrl}-${i}`}
                    source={{ uri: avatarUrl }}
                    style={[styles.avatar, { left: i * 10 }]}
                    contentFit="cover"
                    transition={0}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {renderMarker()}
      {shouldShowLabel && (
        <View style={styles.labelWrapper}>
          {glassEnabled ? (
            <GlassView style={styles.glassLabelContainer}>
              {renderLabelContent()}
            </GlassView>
          ) : (
            <BlurView
              intensity={15}
              tint={isDark ? "dark" : "light"}
              style={styles.labelContainer}
            >
              {renderLabelContent()}
            </BlurView>
          )}
        </View>
      )}
    </View>
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const PopularityMarker = React.memo(
  PopularityMarkerInner,
  (prev, next) =>
    prev.size === next.size &&
    prev.category === next.category &&
    prev.postCount === next.postCount &&
    prev.isFollowed === next.isFollowed &&
    prev.placeName === next.placeName &&
    prev.showLabel === next.showLabel &&
    (prev.events?.length ?? 0) === (next.events?.length ?? 0) &&
    (prev.events ?? []).every(
      (e, i) =>
        e.date === next.events?.[i]?.date &&
        e.startTime === next.events?.[i]?.startTime &&
        e.isHappeningNow === next.events?.[i]?.isHappeningNow &&
        e.attendeeAvatars.length === next.events?.[i]?.attendeeAvatars.length
    ) &&
    arraysEqual(prev.posterAvatars ?? [], next.posterAvatars ?? [])
);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
    },
    eventColumn: {
      alignItems: "center",
      gap: 1,
    },
    eventTimeBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    eventTime: {
      fontSize: 10,
      fontWeight: "700",
      fontFamily: fonts.bold,
      color: colors.category.venue,
    },
    eventTimeNow: {
      color: "#34C759",
    },
    nowDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#34C759",
    },
    followedGlassMarker: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    glassMarker: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    glassLabelContainer: {
      borderRadius: 8,
      overflow: "hidden",
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    marker: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    markerContainer: {
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    blurMarker: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    highlight: {
      position: "absolute",
      top: "10%",
      left: "10%",
    },
    labelWrapper: {
      marginTop: 2,
      borderRadius: 8,
      maxWidth: 200,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.16,
      shadowRadius: 4,
      elevation: 4,
    },
    labelContainer: {
      backgroundColor: colors.translucentCardBackground,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    labelName: {
      fontSize: 11,
      fontWeight: "500",
      fontFamily: fonts.medium,
      textAlign: "center",
      color: colors.text,
    },
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
      gap: 4,
    },
    avatarStack: {
      flexDirection: "row",
      height: 14,
      width: 34, // 14 + 2*10 overlap
    },
    avatar: {
      position: "absolute",
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.cardBackground,
    },
  });
