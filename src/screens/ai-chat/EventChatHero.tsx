import React from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { SFIcon } from "../../components/SFIcon";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";

export function EventChatHero({ colors, eventTitle, eventImageUrl }: { colors: Colors; eventTitle: string; eventImageUrl?: string }) {
  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.gray100, borderColor: colors.border }]}>
        {eventImageUrl ? (
          <Image
            source={{ uri: eventImageUrl }}
            style={styles.eventImage}
          />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: colors.primary + "12" }]}>
            <SFIcon name="calendar" fallback="calendar" size={36} color={colors.primary} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
            {eventTitle}
          </Text>
          <View style={styles.aiLabelRow}>
            <View style={[styles.aiDot, { backgroundColor: colors.primary }]}>
              <SFIcon name="sparkles" fallback="sparkles" size={10} color="#FFFFFF" />
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Ask Welly anything about this event
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 16,
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  eventImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: "center",
  },
  aiLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
});
