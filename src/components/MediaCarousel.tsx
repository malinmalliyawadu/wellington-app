import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ViewToken,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { VideoPlayer } from "./VideoPlayer";
import { ZoomableImage } from "./ZoomableImage";
import { useTheme, type Colors } from "../theme/ThemeContext";
import type { MediaItem } from "../types";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface MediaCarouselProps {
  mediaItems: MediaItem[];
  aspectRatio?: number;
  onAspectRatioChange?: (ratio: number) => void;
  videoMuted?: boolean;
  videoControls?: boolean;
}

const DOT_TIMING = { duration: 250, easing: Easing.out(Easing.ease) };

function AnimatedDot({ isActive }: { isActive: boolean }) {
  const width = useSharedValue(isActive ? 18 : 6);
  const opacity = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    width.value = withTiming(isActive ? 18 : 6, DOT_TIMING);
    opacity.value = withTiming(isActive ? 1 : 0.4, DOT_TIMING);
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: `rgba(255,255,255,${opacity.value})`,
  }));

  return <Animated.View style={[dotBaseStyle, animatedStyle]} />;
}

const dotBaseStyle = {
  height: 6,
  borderRadius: 3,
} as const;

export function MediaCarousel({
  mediaItems,
  aspectRatio = 1,
  onAspectRatioChange,
  videoMuted = true,
  videoControls = false,
}: MediaCarouselProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleImageLoad = useCallback(
    (event: any) => {
      const { width, height } = event.nativeEvent.source;
      if (width && height && onAspectRatioChange) {
        onAspectRatioChange(width / height);
      }
    },
    [onAspectRatioChange]
  );

  const handleVideoLoad = useCallback(
    (event: { width: number; height: number }) => {
      const { width, height } = event;
      if (width && height && onAspectRatioChange) {
        onAspectRatioChange(width / height);
      }
    },
    [onAspectRatioChange]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => {
      const isActive = index === activeIndex;

      if (item.mediaType === "video") {
        return (
          <VideoPlayer
            uri={item.mediaUrl}
            style={[styles.media, { width: SCREEN_WIDTH, aspectRatio }]}
            shouldPlay={isActive}
            isMuted={videoMuted}
            isLooping
            useNativeControls={videoControls}
            onLoad={index === 0 ? handleVideoLoad : undefined}
          />
        );
      }

      return (
        <ZoomableImage
          source={{ uri: item.mediaUrl }}
          style={[styles.media, { width: SCREEN_WIDTH, aspectRatio }]}
          onLoad={index === 0 ? handleImageLoad : undefined}
        />
      );
    },
    [
      activeIndex,
      aspectRatio,
      videoMuted,
      videoControls,
      handleImageLoad,
      handleVideoLoad,
      styles,
    ]
  );

  const showDots = mediaItems.length > 1;

  return (
    <View>
      <FlatList
        data={mediaItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        extraData={activeIndex}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      {showDots && (
        <View style={styles.dotsContainer} pointerEvents="none">
          {mediaItems.map((item, index) => (
            <AnimatedDot
              key={item.id}
              isActive={index === activeIndex}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  media: {
    backgroundColor: colors.gray200,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
});
