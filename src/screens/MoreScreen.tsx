import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>
        Settings, about, and useful information
      </Text>
      <Text style={styles.comingSoon}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  comingSoon: {
    ...typography.h3,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
