import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { fonts } from '../theme/fonts';
import { LevelDefinition } from '../types/Exploration';
import { useTheme, type Colors } from '../theme/ThemeContext';

interface LevelProgressRingProps {
  level: number;
  levelTitle: string;
  totalPoints: number;
  progress: number; // 0-1 progress toward next level
  pointsToNext: number;
  levelColor: string;
  nextLevel: LevelDefinition | null;
  illustration?: number;
}

const BAR_WIDTH = 260;
const BAR_HEIGHT = 8;

export function LevelProgressRing({
  level,
  levelTitle,
  totalPoints,
  progress,
  pointsToNext,
  levelColor,
  nextLevel,
  illustration,
}: LevelProgressRingProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {illustration ? (
        <View style={styles.illustrationContainer}>
          <Image source={illustration} style={styles.illustration} />
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={styles.levelBadgeText}>Lv.{level}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.levelCircle, { backgroundColor: levelColor }]}>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
      )}

      <Text style={styles.levelTitle}>{levelTitle}</Text>
      <Text style={styles.totalPoints}>{totalPoints.toLocaleString()} pts</Text>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 1) * 100}%`,
                backgroundColor: levelColor,
              },
            ]}
          />
        </View>
      </View>

      {nextLevel ? (
        <Text style={styles.nextLevelText}>
          {pointsToNext.toLocaleString()} pts to Level {nextLevel.level}: {nextLevel.title}
        </Text>
      ) : (
        <Text style={[styles.nextLevelText, { color: levelColor, fontFamily: fonts.semiBold }]}>
          Max level reached!
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  levelBadgeText: {
    fontSize: 12,
    fontFamily: fonts.extraBold,
    color: '#fff',
  },
  levelCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  levelNumber: {
    fontSize: 36,
    fontFamily: fonts.extraBold,
    color: '#fff',
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  totalPoints: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    width: BAR_WIDTH,
    marginTop: 16,
  },
  progressBar: {
    height: BAR_HEIGHT,
    backgroundColor: colors.gray200,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
  nextLevelText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 8,
  },
});
