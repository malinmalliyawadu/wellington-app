import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlaceCategory } from '../types';
import { colors } from '../theme/colors';

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
  const fontSize = size < 36 ? 11 : 14;

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
        <Text style={[styles.countTextFilled, { fontSize }]}>{postCount}</Text>
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
      <Text style={[styles.countTextOutlined, { fontSize, color }]}>
        {postCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTextFilled: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countTextOutlined: {
    fontWeight: '700',
  },
});
