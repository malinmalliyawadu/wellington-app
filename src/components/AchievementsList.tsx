import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { useQuery } from "../hooks/useQuery";
import { getAchievementProgress } from "../services/achievements";
import { PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { AchievementCard } from "./AchievementCard";
import { SFIcon } from "./SFIcon";
import { colors } from "../theme/colors";
import { AchievementProgress } from "../types/Exploration";

interface AchievementsListProps {
  userId: string;
}

type AchievementType = "category" | "milestone" | "neighborhood" | "social";

interface AchievementGroup {
  type: AchievementType;
  title: string;
  icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
  achievements: AchievementProgress[];
}

const TYPE_CONFIG: Record<
  AchievementType,
  { title: string; icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap } }
> = {
  category: { title: "Category Explorer", icon: { sf: "square.grid.2x2", fallback: "grid-outline" } },
  milestone: { title: "Milestones", icon: { sf: "trophy", fallback: "trophy-outline" } },
  neighborhood: { title: "Neighborhoods", icon: { sf: "map", fallback: "map-outline" } },
  social: { title: "Social", icon: { sf: "person.2", fallback: "people-outline" } },
};

export function AchievementsList({ userId }: AchievementsListProps) {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  const { data: achievements, loading, error } = useQuery(
    () => getAchievementProgress(userId),
    [userId]
  );

  const { groupedAchievements, stats } = useMemo(() => {
    if (!achievements)
      return { groupedAchievements: [], stats: { total: 0, unlocked: 0 } };

    const groups: Record<AchievementType, AchievementProgress[]> = {
      category: [],
      milestone: [],
      neighborhood: [],
      social: [],
    };

    achievements.forEach((achievement) => {
      const type = achievement.type as AchievementType;
      if (groups[type]) {
        groups[type].push(achievement);
      }
    });

    // Sort: unlocked first (by date desc), then locked by progress
    Object.keys(groups).forEach((type) => {
      groups[type as AchievementType].sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;

        if (a.unlocked && b.unlocked) {
          const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return dateB - dateA;
        }

        const aProgress =
          a.requiredProgress && a.requiredProgress > 0
            ? (a.currentProgress ?? 0) / a.requiredProgress
            : 0;
        const bProgress =
          b.requiredProgress && b.requiredProgress > 0
            ? (b.currentProgress ?? 0) / b.requiredProgress
            : 0;

        if (aProgress !== bProgress) return bProgress - aProgress;
        return a.sortOrder - b.sortOrder;
      });
    });

    const groupedArray: AchievementGroup[] = (
      Object.keys(groups) as AchievementType[]
    )
      .filter((type) => groups[type].length > 0)
      .map((type) => ({
        type,
        title: TYPE_CONFIG[type].title,
        icon: TYPE_CONFIG[type].icon,
        achievements: groups[type],
      }))
      .sort((a, b) => {
        const aUnlocked = a.achievements.filter((x) => x.unlocked).length;
        const bUnlocked = b.achievements.filter((x) => x.unlocked).length;
        return bUnlocked - aUnlocked;
      });

    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlocked).length;

    return {
      groupedAchievements: groupedArray,
      stats: { total, unlocked },
    };
  }, [achievements]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <SFIcon name="exclamationmark.triangle" fallback="warning-outline" size={48} color={colors.gray300} />
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <SFIcon name="trophy" fallback="trophy-outline" size={48} color={colors.gray300} />
        <Text style={styles.emptyTitle}>No Achievements Yet</Text>
        <Text style={styles.emptyText}>
          Start exploring Wellington to unlock your first achievement!
        </Text>
      </View>
    );
  }

  const progressPercent =
    stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryCount}>
            {stats.unlocked}
            <Text style={styles.summaryTotal}> / {stats.total}</Text>
          </Text>
          <Text style={styles.summaryLabel}>achievements unlocked</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryPercent}>{progressPercent}%</Text>
        </View>
      </View>

      {/* Overall progress bar */}
      <View style={styles.overallProgressContainer}>
        <View style={styles.overallProgressBar}>
          <View
            style={[
              styles.overallProgressFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
      </View>

      {/* Grouped Achievements */}
      {groupedAchievements.map((group) => {
        const unlockedCount = group.achievements.filter(
          (a) => a.unlocked
        ).length;

        return (
          <View key={group.type} style={styles.section}>
            <View style={styles.sectionHeader}>
              <SFIcon
                name={group.icon.sf}
                fallback={group.icon.fallback}
                size={18}
                color={colors.textMuted}
              />
              <Text style={styles.sectionTitle}>{group.title}</Text>
              <Text style={styles.sectionCount}>
                {unlockedCount}/{group.achievements.length}
              </Text>
            </View>
            <View style={styles.sectionCards}>
              {group.achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  summaryLeft: {},
  summaryCount: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.text,
  },
  summaryTotal: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.gray300,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryRight: {},
  summaryPercent: {
    fontSize: 32,
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.primary,
  },
  overallProgressContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  overallProgressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: "hidden",
  },
  overallProgressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.gray100,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.textMuted,
  },
  sectionCards: {},
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
