import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

export function GradientHeaderBackground() {
  return (
    <BlurView intensity={80} tint="light" style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
        style={StyleSheet.absoluteFill}
      />
    </BlurView>
  );
}

export const gradientHeaderOptions = {
  headerTitle: () => null,
  headerTransparent: true,
  headerBackground: () => <GradientHeaderBackground />,
};
