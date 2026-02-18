import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SFIcon } from './SFIcon';
import { colors } from '../theme/colors';

interface VideoThumbnailProps {
  thumbnailUrl?: string;
  style?: StyleProp<ViewStyle>;
}

export function VideoThumbnail({ thumbnailUrl, style }: VideoThumbnailProps) {
  return (
    <View style={[styles.container, style]}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.overlay}>
        <SFIcon name="play.fill" fallback="play" size={24} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray300,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
