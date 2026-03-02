import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme/fonts';
import { BadgeProgress } from '../types/Exploration';
import { useTheme, type Colors } from '../theme/ThemeContext';

interface BadgeCardProps {
  badge: BadgeProgress;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { title, iconName, badgeColor, unlocked, currentProgress, requiredProgress } = badge;

  const progressPercent =
    requiredProgress && requiredProgress > 0
      ? Math.min((currentProgress ?? 0) / requiredProgress, 1)
      : 0;

  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <View
        style={[
          styles.iconContainer,
          unlocked
            ? { backgroundColor: badgeColor + '20' }
            : { backgroundColor: colors.gray100 },
        ]}
      >
        <Text style={[styles.emoji, !unlocked && styles.emojiLocked]}>
          {iconName}
        </Text>
      </View>
      <Text style={[styles.title, !unlocked && styles.titleLocked]} numberOfLines={2}>
        {title}
      </Text>
      {unlocked ? (
        <View style={[styles.checkmark, { backgroundColor: badgeColor }]}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      ) : requiredProgress != null && requiredProgress > 0 ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent * 100}%`, backgroundColor: badgeColor },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentProgress ?? 0}/{requiredProgress}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    cardLocked: {
      opacity: 0.5,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emoji: {
      fontSize: 24,
    },
    emojiLocked: {
      opacity: 0.4,
    },
    title: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 16,
    },
    titleLocked: {
      color: colors.textMuted,
    },
    checkmark: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    checkmarkText: {
      fontSize: 11,
      color: '#fff',
      fontFamily: fonts.bold,
    },
    progressContainer: {
      width: '100%',
      marginTop: 8,
      alignItems: 'center',
    },
    progressBar: {
      width: '100%',
      height: 3,
      backgroundColor: colors.gray200,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      fontSize: 10,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 3,
    },
  });
