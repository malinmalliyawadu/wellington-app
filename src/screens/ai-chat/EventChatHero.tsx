import React from "react";
import { View, Text, Image } from "react-native";
import { SFIcon } from "../../components/SFIcon";
import type { Colors } from "../../theme/ThemeContext";
import { heroStyles } from "./WellyHero";

export function EventChatHero({ colors, eventTitle, eventImageUrl }: { colors: Colors; eventTitle: string; eventImageUrl?: string }) {
  return (
    <View style={heroStyles.container}>
      {eventImageUrl ? (
        <Image
          source={{ uri: eventImageUrl }}
          style={heroStyles.eventImage}
        />
      ) : (
        <View style={[heroStyles.eventImagePlaceholder, { backgroundColor: colors.primary + "15" }]}>
          <SFIcon name="calendar" fallback="calendar" size={32} color={colors.primary} />
        </View>
      )}
      <Text style={[heroStyles.eventTitle, { color: colors.text }]} numberOfLines={2}>
        {eventTitle}
      </Text>
      <Text style={[heroStyles.subtitle, { color: colors.textSecondary }]}>
        Ask anything about this event
      </Text>
    </View>
  );
}
