import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { SFIcon } from './SFIcon';
import { useTheme, type Colors } from '../theme/ThemeContext';

interface VideoThumbnailProps {
  thumbnailUrl?: string;
  fallbackUrl?: string;
  style?: StyleProp<ViewStyle>;
}

export function VideoThumbnail({ thumbnailUrl, fallbackUrl, style }: VideoThumbnailProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const imageUrl = thumbnailUrl || fallbackUrl;
  return (
    <View style={[styles.container, style]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.overlay}>
        <SFIcon name="play.fill" fallback="play" size={24} color="#FFFFFF" />
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
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
