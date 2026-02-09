import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';

interface VideoPlayerProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  shouldPlay?: boolean;
  isMuted?: boolean;
  isLooping?: boolean;
  useNativeControls?: boolean;
}

export function VideoPlayer({
  uri,
  style,
  shouldPlay = false,
  isMuted = true,
  isLooping = false,
  useNativeControls = false,
}: VideoPlayerProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = isLooping;
    p.muted = isMuted;
    if (shouldPlay) {
      p.play();
    }
  });

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={useNativeControls}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
