import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import { createStyles } from "./chatStyles";
import { CATEGORY_ICONS } from "./chatHelpers";
import type {
  Place,
  AIPlaceRecommendation,
  AIEventRecommendation,
  AIGuideRecommendation,
} from "../../types";

export function PlaceRecommendationCard({
  recommendation,
  placeData,
  onPress,
}: {
  recommendation: AIPlaceRecommendation;
  placeData?: Place;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const icon =
    CATEGORY_ICONS[recommendation.category] ?? CATEGORY_ICONS.attraction;
  const categoryColor =
    (colors.category as Record<string, string>)[recommendation.category] ??
    colors.primary;

  return (
    <HapticPressable style={styles.recCard} onPress={onPress}>
      <View
        style={[
          styles.recIconCircle,
          { backgroundColor: categoryColor + "15" },
        ]}
      >
        <SFIcon
          name={icon.sf}
          fallback={icon.fallback}
          size={18}
          color={categoryColor}
        />
      </View>
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={1}>
          {recommendation.placeName}
        </Text>
        <Text style={styles.recCardReason} numberOfLines={2}>
          {recommendation.reason}
        </Text>
      </View>
      <SFIcon
        name="chevron.right"
        fallback="chevron-forward"
        size={16}
        color={colors.gray400}
      />
    </HapticPressable>
  );
}

export function EventRecommendationCard({
  recommendation,
  onPress,
}: {
  recommendation: AIEventRecommendation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const eventDate = new Date(recommendation.date);
  const dateLabel = eventDate.toLocaleDateString("en-NZ", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = recommendation.startTime
    ? ` · ${recommendation.startTime}`
    : "";

  return (
    <HapticPressable style={styles.recCard} onPress={onPress}>
      <View
        style={[
          styles.recIconCircle,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <SFIcon
          name="calendar"
          fallback="calendar"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={1}>
          {recommendation.eventTitle}
        </Text>
        <Text style={styles.recCardDate}>
          {dateLabel}
          {timeLabel}
        </Text>
        <Text style={styles.recCardReason} numberOfLines={2}>
          {recommendation.reason}
        </Text>
      </View>
      <SFIcon
        name="chevron.right"
        fallback="chevron-forward"
        size={16}
        color={colors.gray400}
      />
    </HapticPressable>
  );
}

export function GuideRecommendationCard({
  recommendation,
  onPress,
}: {
  recommendation: AIGuideRecommendation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <HapticPressable style={styles.recCard} onPress={onPress}>
      <View
        style={[
          styles.recIconCircle,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <SFIcon
          name="book.fill"
          fallback="book"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={1}>
          {recommendation.guideTitle}
        </Text>
        <Text style={styles.recCardDate}>
          by {recommendation.creatorName} · {recommendation.placeCount} places
        </Text>
        <Text style={styles.recCardReason} numberOfLines={2}>
          {recommendation.reason}
        </Text>
      </View>
      <SFIcon
        name="chevron.right"
        fallback="chevron-forward"
        size={16}
        color={colors.gray400}
      />
    </HapticPressable>
  );
}
