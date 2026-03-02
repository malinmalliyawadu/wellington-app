import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BadgeCard } from './BadgeCard';
import { BadgeProgress, BadgeType } from '../types/Exploration';
import { fonts } from '../theme/fonts';
import { useTheme, type Colors } from '../theme/ThemeContext';

interface BadgeGridProps {
  badges: BadgeProgress[];
}

const SECTION_CONFIG: Record<BadgeType, { title: string }> = {
  level: { title: 'Level Badges' },
  activity: { title: 'Activity Badges' },
  wellington: { title: 'Wellington Badges' },
};

const SECTION_ORDER: BadgeType[] = ['level', 'activity', 'wellington'];

export function BadgeGrid({ badges }: BadgeGridProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const grouped: Record<BadgeType, BadgeProgress[]> = {
    level: [],
    activity: [],
    wellington: [],
  };

  badges.forEach((badge) => {
    if (grouped[badge.badgeType]) {
      grouped[badge.badgeType].push(badge);
    }
  });

  return (
    <View style={styles.container}>
      {SECTION_ORDER.map((type) => {
        const sectionBadges = grouped[type];
        if (sectionBadges.length === 0) return null;
        const unlockedCount = sectionBadges.filter((b) => b.unlocked).length;
        const config = SECTION_CONFIG[type];

        return (
          <View key={type} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{config.title}</Text>
              <Text style={styles.sectionCount}>
                {unlockedCount}/{sectionBadges.length}
              </Text>
            </View>
            <View style={styles.grid}>
              {sectionBadges.map((badge, index) => (
                <View key={badge.id} style={styles.gridItem}>
                  <BadgeCard badge={badge} />
                </View>
              ))}
              {/* Filler items for alignment */}
              {sectionBadges.length % 3 !== 0 &&
                Array.from({ length: 3 - (sectionBadges.length % 3) }).map((_, i) => (
                  <View key={`filler-${i}`} style={styles.gridItem} />
                ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {},
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    sectionCount: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
    },
    gridItem: {
      width: '33.33%',
      padding: 4,
    },
  });
