import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AchievementProgress } from "../types/Exploration";
import { colors } from "../theme/colors";

interface AchievementCardProps {
  achievement: AchievementProgress;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const {
    title,
    description,
    iconName,
    badgeColor,
    unlocked,
    unlockedAt,
    currentProgress,
    requiredProgress,
  } = achievement;

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : undefined;

  const progressPercent =
    requiredProgress && requiredProgress > 0
      ? Math.min((currentProgress ?? 0) / requiredProgress, 1)
      : 0;

  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{iconName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, !unlocked && styles.titleLocked]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {unlocked && formattedDate && (
            <Text style={styles.dateText}>{formattedDate}</Text>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {!unlocked && requiredProgress != null && requiredProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent * 100}%`,
                    backgroundColor: badgeColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentProgress ?? 0}/{requiredProgress}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cardLocked: {
    opacity: 0.55,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  emoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  titleLocked: {
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 19,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: "hidden",
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    minWidth: 32,
    textAlign: "right",
  },
});
