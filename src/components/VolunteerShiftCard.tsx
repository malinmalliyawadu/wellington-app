import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import type { Event } from "../types";

interface VolunteerShiftCardProps {
  events: Event[];
  onEventPress?: (eventId: string) => void;
}

function formatShiftDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", {
    timeZone: "Pacific/Auckland",
  });
  if (dateStr === todayStr) return "Today";
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const today = new Date(ty, tm - 1, td);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-NZ", {
      weekday: "short",
      timeZone: "Pacific/Auckland",
    });
  }
  return date.toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
  });
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}${minutes !== "00" ? `:${minutes}` : ""}${suffix}`;
}

export const VolunteerShiftCard = React.memo(function VolunteerShiftCard({
  events,
  onEventPress,
}: VolunteerShiftCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Show up to 4 upcoming shifts
  const displayEvents = events.slice(0, 4);
  const remaining = events.length - displayEvents.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <SFIcon
            name="hands.sparkles.fill"
            fallback="heart"
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Volunteer with Everybody Eats</Text>
          <Text style={styles.subtitle}>
            {events.length} upcoming shift{events.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.shiftList}>
        {displayEvents.map((event) => (
          <HapticPressable
            key={event.id}
            style={styles.shiftRow}
            onPress={() => onEventPress?.(event.id)}
          >
            <View style={styles.shiftDate}>
              <Text style={styles.shiftDateText}>
                {formatShiftDate(event.date)}
              </Text>
            </View>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftTime}>
                {formatTime(event.startTime)}
                {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
              </Text>
              <Text style={styles.shiftType} numberOfLines={1}>
                {event.title.replace("Everybody Eats – ", "")}
              </Text>
            </View>
            <SFIcon
              name="chevron.right"
              fallback="chevron-forward"
              size={12}
              color={colors.textMuted}
            />
          </HapticPressable>
        ))}
      </View>

      {remaining > 0 && (
        <Text style={styles.moreText}>
          +{remaining} more shift{remaining !== 1 ? "s" : ""}
        </Text>
      )}

      {events[0]?.everybodyEatsUrl && (
        <HapticPressable
          style={styles.signupButton}
          onPress={() => {
            WebBrowser.openBrowserAsync(events[0].everybodyEatsUrl!);
          }}
        >
          <SFIcon
            name="arrow.up.right"
            fallback="open-outline"
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.signupText}>Sign up to volunteer</Text>
        </HapticPressable>
      )}
    </View>
  );
});

const VOLUNTEER_GREEN = "#16A34A";

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VOLUNTEER_GREEN + "30",
      marginHorizontal: 16,
      padding: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: VOLUNTEER_GREEN,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 1,
    },
    shiftList: {
      gap: 2,
    },
    shiftRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 4,
      gap: 12,
    },
    shiftDate: {
      width: 64,
    },
    shiftDateText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: VOLUNTEER_GREEN,
    },
    shiftInfo: {
      flex: 1,
    },
    shiftTime: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    shiftType: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 1,
    },
    moreText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      textAlign: "center",
    },
    signupButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: VOLUNTEER_GREEN,
      borderRadius: 12,
      paddingVertical: 12,
      gap: 6,
    },
    signupText: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
    },
  });
