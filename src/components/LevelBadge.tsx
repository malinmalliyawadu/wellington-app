import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme/fonts';
import { getLevelForPoints } from '../data/achievementDefinitions';

interface LevelBadgeProps {
  level: number;
  totalPoints?: number;
  size?: 'small' | 'medium';
}

export function LevelBadge({ level, totalPoints, size = 'small' }: LevelBadgeProps) {
  const levelDef = getLevelForPoints(totalPoints ?? 0);
  const color = levelDef.color;
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, { backgroundColor: color }, isSmall ? styles.small : styles.medium]}>
      <Text style={[styles.text, isSmall ? styles.textSmall : styles.textMedium]}>
        Lv.{level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  medium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  text: {
    fontFamily: fonts.bold,
    color: '#fff',
  },
  textSmall: {
    fontSize: 11,
  },
  textMedium: {
    fontSize: 13,
  },
});
