import React, { useEffect } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme, type Colors } from "../theme/ThemeContext";

interface VideoPlayerProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  shouldPlay?: boolean;
  isMuted?: boolean;
  isLooping?: boolean;
  useNativeControls?: boolean;
  onLoad?: (event: { width: number; height: number }) => void;
}

export function VideoPlayer({
  uri,
  style,
  shouldPlay = false,
  isMuted = true,
  isLooping = true,
  useNativeControls = false,
  onLoad,
}: VideoPlayerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = isLooping;
    p.muted = isMuted;
    if (shouldPlay) {
      p.play();
    }
  });

  useEffect(() => {
    if (!player) return;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, shouldPlay]);

  useEffect(() => {
    if (!onLoad || !player) return;

    const subscription = player.addListener("statusChange", (status) => {
      if (status.status === "readyToPlay" && player.currentTime === 0) {
        // Get video dimensions from the player
        const width = (player as any).videoWidth;
        const height = (player as any).videoHeight;
        if (width && height) {
          onLoad({ width, height });
        }
      }
    });

    return () => subscription.remove();
  }, [player, onLoad]);

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={useNativeControls}
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor: colors.gray200,
      overflow: "hidden",
    },
    video: {
      width: "100%",
      height: "100%",
    },
  });
