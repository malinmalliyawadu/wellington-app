import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AchievementProgress } from '../types/Exploration';
import { colors } from '../theme/colors';

interface AchievementCardProps {
  achievement: AchievementProgress;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { title, description, iconName, badgeColor, unlocked, unlockedAt, currentProgress, requiredProgress } = achievement;

  const formattedDate = unlockedAt ? new Date(unlockedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : undefined;

  const progressPercent = requiredProgress && requiredProgress > 0
    ? Math.min((currentProgress ?? 0) / requiredProgress, 1)
    : 0;

  return (
    <View style={[styles.card, unlocked && styles.cardUnlocked]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: unlocked ? badgeColor : colors.gray300 },
        ]}
      >
        <Ionicons
          name={iconName as any}
          size={24}
          color="#fff"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {unlocked && formattedDate && (
          <Text style={styles.unlockedDate}>Unlocked {formattedDate}</Text>
        )}

        {!unlocked && requiredProgress && requiredProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentProgress ?? 0} / {requiredProgress}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnlocked: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  unlockedDate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
