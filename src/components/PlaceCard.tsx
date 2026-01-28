import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Place, PlaceCategory } from '../types';
import { colors } from '../theme/colors';

interface PlaceCardProps {
  place: Place;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
};

export function PlaceCard({ place, onClose }: PlaceCardProps) {
  const categoryColor = colors.category[place.category];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{place.name}</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>{CATEGORY_LABELS[place.category]}</Text>
        </View>
      </View>
      <Text style={styles.address}>{place.address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: colors.gray400,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
