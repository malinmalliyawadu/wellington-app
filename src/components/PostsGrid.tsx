import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
          <>
            {item.type === "video" ? (
              <VideoThumbnail
                thumbnailUrl={item.thumbnailUrl}
                style={styles.postImage}
              />
            ) : (
              <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
            )}
            {/* Gradient overlay for better text contrast */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.gradientOverlay}
            />
            {/* Video indicator */}
            {item.type === "video" && (
              <View style={styles.videoIndicator}>
                <Ionicons
                  name="play-circle"
                  size={32}
                  color="rgba(255,255,255,0.9)"
                />
              </View>
            )}
          </>
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.textPostTile}
          >
            <Text style={styles.textPostContent} numberOfLines={6}>
              {item.content}
            </Text>
          </LinearGradient>
        )}
        {item.place && (
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.placeTag}
          >
            <Ionicons name="location" size={10} color="#FFFFFF" />
            <Text style={styles.placeText} numberOfLines={1}>
              {item.place.name}
            </Text>
          </LinearGradient>
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
    paddingLeft: 16,
    alignItems: "center",
    alignContent: "center",
  },
  masonryContent: {
    paddingVertical: 8,
  },
  postTile: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  videoIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -16 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  textPostTile: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  textPostContent: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
    fontWeight: "600",
  },
  placeTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  placeText: {
    flex: 1,
    fontSize: 12,
    color: "#FFFFFF",
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
