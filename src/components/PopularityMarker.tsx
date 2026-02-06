import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceCategory } from '../types';
import { colors } from '../theme/colors';

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  cafe: 'cafe',
  restaurant: 'restaurant',
  bar: 'wine',
  attraction: 'compass',
  park: 'leaf',
  venue: 'musical-notes',
};

interface PopularityMarkerProps {
  size: number;
  category: PlaceCategory;
  postCount: number;
  isFollowed: boolean;
}

export function PopularityMarker({
  size,
  category,
  postCount,
  isFollowed,
}: PopularityMarkerProps) {
  const color = colors.category[category];
  const iconSize = size < 36 ? 14 : 18;
  const iconName = CATEGORY_ICONS[category];

  if (isFollowed) {
    return (
      <View
        style={[
          styles.marker,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.marker,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderColor: color,
          opacity: 0.6,
        },
      ]}
    >
      <Ionicons name={iconName} size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
