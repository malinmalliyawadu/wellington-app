import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import MasonryList from "reanimated-masonry-list";
import { VideoThumbnail } from "./VideoThumbnail";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";
import type { Post, Place } from "../types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 16; // Match screen padding
const COLUMN_GAP = 16; // Space between columns
const NUM_COLUMNS = 2;
const ITEM_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

type PostWithPlace = Post & { place?: Place };

interface PostsGridProps {
  posts: PostWithPlace[];
  onPostPress: (postId: string) => void;
  emptyText?: string;
}

export function PostsGrid({
  posts,
  onPostPress,
  emptyText = "No posts yet",
}: PostsGridProps) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: PostWithPlace }) => {
    // Calculate aspect ratio for varying heights
    const aspectRatio = item.type === "text" ? 1 : 0.75 + Math.random() * 0.75;
    const height = ITEM_WIDTH / aspectRatio;

    return (
      <HapticPressable
        style={[styles.postTile, { width: ITEM_WIDTH, height }]}
        onPress={() => onPostPress(item.id)}
      >
        {item.mediaUrl ? (
          item.type === "video" ? (
            <VideoThumbnail
              thumbnailUrl={item.thumbnailUrl}
              style={styles.postImage}
            />
          ) : (
            <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
          )
        ) : (
          <View style={styles.textPostTile}>
            <Text style={styles.textPostContent} numberOfLines={6}>
              {item.content}
            </Text>
          </View>
        )}
        {item.place && (
          <View style={styles.postOverlay}>
            <Text style={styles.postPlace} numberOfLines={1}>
              {item.place.name}
            </Text>
          </View>
        )}
      </HapticPressable>
    );
  };

  return (
    <View style={styles.container}>
      <MasonryList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.masonryContent}
        scrollEnabled={false}
        gutter={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  masonryContent: {
    paddingVertical: 8,
  },
  postTile: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.gray100,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  textPostTile: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
  },
  textPostContent: {
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  postOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  postPlace: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "500",
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
