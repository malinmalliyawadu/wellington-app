import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { VideoThumbnail } from "./VideoThumbnail";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";
import type { Post, Place } from "../types";

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
      <View style={styles.container}>
        {posts.map((item) => (
        <HapticPressable
          key={item.id}
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
                />
              )}
              {item.type === "video" && (
                <View style={styles.videoIndicator}>
                  <Ionicons
                    name="play-circle"
                    size={28}
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
              <Text style={styles.textPostContent} numberOfLines={4}>
                {item.content}
              </Text>
            </LinearGradient>
          )}
          {item.place && (
            <View style={styles.placeTag}>
              <Ionicons
                name="location"
                size={9}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.placeText} numberOfLines={1}>
                {item.place.name}
              </Text>
            </View>
          )}
        </HapticPressable>
      ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
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
  },
  placeTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 5,
    paddingVertical: 4,
    gap: 2,
  },
  placeText: {
    flex: 1,
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
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
