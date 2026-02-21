import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ViewToken,
} from "react-native";
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
        <View style={styles.dotsContainer}>
          {mediaItems.map((item, index) => (
            <View
              key={item.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray300,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
