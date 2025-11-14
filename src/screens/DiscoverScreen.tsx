import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';
import { TOP_ATTRACTIONS, CATEGORIES } from '../constants/wellington';

export default function DiscoverScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Wellington</Text>
        <Text style={styles.subtitle}>The coolest little capital</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Attractions</Text>
        {TOP_ATTRACTIONS.map((attraction) => (
          <View key={attraction.id} style={styles.attractionCard}>
            <View style={styles.attractionContent}>
              <Text style={styles.attractionName}>{attraction.name}</Text>
              <Text style={styles.attractionCategory}>{attraction.category}</Text>
              <Text style={styles.attractionDescription}>
                {attraction.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    ...typography.h1,
    color: colors.background,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.background,
    opacity: 0.9,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    minWidth: 100,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.caption,
    color: colors.text.primary,
    textAlign: 'center',
  },
  attractionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attractionContent: {
    flex: 1,
  },
  attractionName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  attractionCategory: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  attractionDescription: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
