import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '../hooks/useQuery';
import { getAchievementProgress } from '../services/achievements';
import { AchievementCard } from './AchievementCard';
import { colors } from '../theme/colors';

interface AchievementsListProps {
  userId: string;
}

export function AchievementsList({ userId }: AchievementsListProps) {
  const { data: achievements, loading } = useQuery(() => getAchievementProgress(userId), [userId]);

  const { unlockedAchievements, topLockedAchievements } = useMemo(() => {
    if (!achievements) return { unlockedAchievements: [], topLockedAchievements: [] };

    const unlocked = achievements.filter((a) => a.unlocked);
    const locked = achievements.filter((a) => !a.unlocked);

    // Sort locked achievements by progress (highest first), then by sort order
    const sortedLocked = locked.sort((a, b) => {
      const aProgress = a.requiredProgress && a.requiredProgress > 0
        ? (a.currentProgress ?? 0) / a.requiredProgress
        : 0;
      const bProgress = b.requiredProgress && b.requiredProgress > 0
        ? (b.currentProgress ?? 0) / b.requiredProgress
        : 0;

      if (aProgress !== bProgress) {
        return bProgress - aProgress; // Higher progress first
      }

      return a.sortOrder - b.sortOrder;
    });

    return {
      unlockedAchievements: unlocked,
      topLockedAchievements: sortedLocked.slice(0, 5),
    };
  }, [achievements]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {unlockedAchievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Unlocked ({unlockedAchievements.length})
          </Text>
          <View style={styles.list}>
            {unlockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      )}

      {topLockedAchievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In Progress</Text>
          <View style={styles.list}>
            {topLockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      )}

      {unlockedAchievements.length === 0 && topLockedAchievements.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Start exploring Wellington to unlock achievements!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
