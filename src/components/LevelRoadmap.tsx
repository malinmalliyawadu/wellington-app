import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LEVEL_DEFINITIONS } from '../data/achievementDefinitions';
import { fonts } from '../theme/fonts';
import { useTheme, type Colors } from '../theme/ThemeContext';

interface LevelRoadmapProps {
  currentLevel: number;
  totalPoints: number;
}

export function LevelRoadmap({ currentLevel, totalPoints }: LevelRoadmapProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {LEVEL_DEFINITIONS.map((level, index) => {
        const isReached = currentLevel >= level.level;
        const isCurrent = currentLevel === level.level;
        const isLast = index === LEVEL_DEFINITIONS.length - 1;

        return (
          <View key={level.level} style={styles.row}>
            {/* Connector line + dot/illustration */}
            <View style={styles.timeline}>
              {index > 0 && (
                <View
                  style={[
                    styles.lineTop,
                    isReached && { backgroundColor: level.color },
                  ]}
                />
              )}
              {level.illustration ? (
                <Image
                  source={level.illustration}
                  style={[
                    styles.illustrationDot,
                    isCurrent && styles.illustrationDotCurrent,
                    !isReached && styles.illustrationLocked,
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.dot,
                    isReached && { backgroundColor: level.color, borderColor: level.color },
                    isCurrent && styles.dotCurrent,
                  ]}
                />
              )}
              {!isLast && (
                <View
                  style={[
                    styles.lineBottom,
                    currentLevel > level.level && {
                      backgroundColor: LEVEL_DEFINITIONS[index + 1].color,
                    },
                  ]}
                />
              )}
            </View>

            {/* Level info */}
            <View style={[styles.info, isCurrent && styles.infoCurrent]}>
              <View style={styles.infoRow}>
                <Text style={[styles.levelNum, isReached && { color: level.color }]}>
                  {level.level}
                </Text>
                <Text style={[styles.title, isReached && styles.titleReached]}>
                  {level.title}
                </Text>
              </View>
              <Text style={styles.points}>
                {level.pointsRequired.toLocaleString()} pts
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: 'row',
      minHeight: 48,
    },
    timeline: {
      width: 36,
      alignItems: 'center',
    },
    lineTop: {
      width: 2,
      flex: 1,
      backgroundColor: colors.gray200,
    },
    lineBottom: {
      width: 2,
      flex: 1,
      backgroundColor: colors.gray200,
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.gray200,
      borderWidth: 2,
      borderColor: colors.gray300,
    },
    dotCurrent: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 3,
    },
    illustrationDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    illustrationDotCurrent: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },
    illustrationLocked: {
      opacity: 0.35,
    },
    info: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 12,
      paddingVertical: 10,
    },
    infoCurrent: {
      backgroundColor: colors.gray100,
      borderRadius: 10,
      paddingHorizontal: 12,
      marginLeft: 8,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    levelNum: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.textMuted,
      width: 20,
    },
    title: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    titleReached: {
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    points: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
  });
