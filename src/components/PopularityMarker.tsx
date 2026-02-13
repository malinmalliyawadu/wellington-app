import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
    // Filled marker with liquid glass effect
    return (
      <View
        style={[
          styles.markerContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <BlurView
          intensity={30}
          tint="light"
          style={[
            styles.marker,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {/* Base color layer with transparency */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: color,
                opacity: 0.85,
                borderRadius: size / 2,
              },
            ]}
          />

          {/* Gradient overlay for depth */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: size / 2 },
            ]}
          />

          {/* Glass reflection highlight */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={[
              styles.highlight,
              {
                width: size * 0.6,
                height: size * 0.6,
                borderRadius: (size * 0.6) / 2,
              },
            ]}
          />

          {/* Icon */}
          <Ionicons name={iconName} size={iconSize} color="#FFFFFF" style={{ zIndex: 10 }} />
        </BlurView>
      </View>
    );
  }

  // Unfilled marker with enhanced glass effect
  return (
    <View
      style={[
        styles.markerContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <BlurView
        intensity={40}
        tint="light"
        style={[
          styles.blurMarker,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* Frosted glass background */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              borderRadius: size / 2,
              borderWidth: 2.5,
              borderColor: color,
            },
          ]}
        />

        {/* Gradient overlay for glass depth */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size / 2 },
          ]}
        />

        {/* Top highlight for glass reflection */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={[
            styles.highlight,
            {
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: (size * 0.5) / 2,
            },
          ]}
        />

        {/* Icon */}
        <Ionicons name={iconName} size={iconSize} color={color} style={{ zIndex: 10 }} />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  markerContainer: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  blurMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: '10%',
    left: '10%',
  },
});
