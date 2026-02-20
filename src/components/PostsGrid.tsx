import React, { useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { VideoThumbnail } from "./VideoThumbnail";
import { SFIcon } from "./SFIcon";
import { fonts } from "../theme/fonts";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";
import { isMultiMediaPost } from "../utils/postMedia";
import type { Post, Place } from "../types";
import { GlassView } from "expo-glass-effect";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GAP = 1.5;
const NUM_COLUMNS = 3;
const CELL_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type PostWithPlace = Post & { place?: Place };

interface PostsGridProps {
  posts: PostWithPlace[];
  onPostPress: (postId: string) => void;
  title?: string;
  emptyText?: string;
}

export function PostsGrid({
  posts,
  onPostPress,
  title,
  emptyText = "No posts yet",
}: PostsGridProps) {
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CELL_SIZE,
      offset: (CELL_SIZE + GAP) * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: PostWithPlace }) => (
      <HapticPressable
        style={styles.postTile}
        onPress={() => onPostPress(item.id)}
      >
        {item.mediaUrl ? (
          <>
            {item.type === "video" ? (
              <VideoThumbnail
                thumbnailUrl={item.thumbnailUrl}
                style={styles.postImage}
              />
            ) : (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
            )}
            {isMultiMediaPost(item) ? (
              <View style={styles.multiMediaIndicator}>
                <SFIcon
                  name="square.fill.on.square.fill"
                  fallback="copy"
                  size={16}
                  color="rgba(255,255,255,0.9)"
                />
              </View>
            ) : item.type === "video" ? (
              <View style={styles.videoIndicator}>
                <SFIcon
                  name="play.circle.fill"
                  fallback="play-circle"
                  size={28}
                  color="rgba(255,255,255,0.9)"
                />
              </View>
            ) : null}
          </>
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.textPostTile}
          >
            <Text style={styles.textPostContent} numberOfLines={4}>
              {item.content}
            </Text>
          </LinearGradient>
        )}
        {item.place && (
          <GlassView
            style={styles.placeTag}
            colorScheme="light"
            glassEffectStyle="clear"
          >
            <SFIcon
              name="mappin"
              fallback="location"
              size={9}
              color="rgba(255,255,255,0.85)"
            />
            <Text style={styles.placeText} numberOfLines={1}>
              {item.place.name}
            </Text>
          </GlassView>
        )}
      </HapticPressable>
    ),
    [onPostPress]
  );

  if (posts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        getItemLayout={getItemLayout}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  columnWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  postTile: {
    width: CELL_SIZE,
    aspectRatio: 1,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  videoIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  multiMediaIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  textPostTile: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  textPostContent: {
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  placeTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 4,
    gap: 2,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  placeText: {
    flex: 1,
    fontSize: 9,
    color: "rgba(255,255,255,1)",
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
