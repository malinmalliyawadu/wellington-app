import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { usePoints } from "../context/PointsContext";
import { useQuery } from "../hooks/useQuery";
import { getBadgeProgress } from "../services/achievements";
import { getPointHistory } from "../services/points";
import { getPointsToNextLevel } from "../data/achievementDefinitions";
import { LevelProgressRing } from "../components/LevelProgressRing";
import { BadgeGrid } from "../components/BadgeGrid";
import { LevelRoadmap } from "../components/LevelRoadmap";
import { PointHistoryItem } from "../components/PointHistoryItem";
import { SFIcon } from "../components/SFIcon";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

export function AchievementsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { totalPoints, level, levelDefinition, pointsToNextLevel, nextLevelProgress, pointTotals } = usePoints();

  const userId = profile?.id ?? "";
  const { next } = getPointsToNextLevel(totalPoints);

  const fetchBadges = useCallback(
    () => {
      if (!pointTotals) return Promise.resolve([]);
      return getBadgeProgress(userId, pointTotals);
    },
    [userId, pointTotals]
  );
  const { data: badges, loading: badgesLoading } = useQuery(fetchBadges, ['badges', userId, level], { enabled: !!pointTotals });

  const fetchHistory = useCallback(
    () => getPointHistory(userId, 5),
    [userId]
  );
  const { data: history, loading: historyLoading } = useQuery(fetchHistory, ['point-history', userId]);

  const badgesEarned = badges?.filter((b) => b.unlocked).length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 8, paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Progress Ring */}
        <LevelProgressRing
          level={level}
          levelTitle={levelDefinition.title}
          totalPoints={totalPoints}
          progress={nextLevelProgress}
          pointsToNext={pointsToNextLevel}
          levelColor={levelDefinition.color}
          nextLevel={next}
          illustration={levelDefinition.illustration}
        />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{badgesEarned}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {historyLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 16 }} />
          ) : history && history.length > 0 ? (
            history.map((entry) => (
              <PointHistoryItem key={entry.id} entry={entry} />
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>No activity yet. Start exploring!</Text>
            </View>
          )}
        </View>

        {/* Badge Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {badgesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 16 }} />
          ) : badges && badges.length > 0 ? (
            <BadgeGrid badges={badges} />
          ) : (
            <View style={styles.emptyActivity}>
              <SFIcon name="trophy" fallback="trophy-outline" size={40} color={colors.gray300} />
              <Text style={styles.emptyText}>Badges will appear here</Text>
            </View>
          )}
        </View>

        {/* Level Roadmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level Roadmap</Text>
          <LevelRoadmap currentLevel={level} totalPoints={totalPoints} />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {},
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingVertical: 16,
      gap: 24,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 32,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    emptyActivity: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
  });
