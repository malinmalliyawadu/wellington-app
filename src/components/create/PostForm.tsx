import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import * as ExpoVideoThumbnails from "expo-video-thumbnails";
import { SFIcon } from "../SFIcon";
import { HapticPressable } from "../HapticPressable";
import { VideoThumbnail } from "../VideoThumbnail";
import { PostType } from "../../types";
import { colors } from "../../theme/colors";

const POST_TYPES: {
  type: PostType;
  icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
  label: string;
}[] = [
  { type: "photo", icon: { sf: "photo.fill", fallback: "image" }, label: "Photo" },
  { type: "video", icon: { sf: "video.fill", fallback: "videocam" }, label: "Video" },
  { type: "text", icon: { sf: "doc.text.fill", fallback: "document-text" }, label: "Text" },
];

const MAX_CONTENT_LENGTH = 500;
const MAX_MEDIA_ITEMS = 5;

export interface MediaPickerItem {
  uri: string;
  type: 'photo' | 'video';
  width?: number;
  height?: number;
}

interface PostFormProps {
  avatarUrl?: string;
  content: string;
  onContentChange: (text: string) => void;
  postType: PostType;
  onPostTypeChange: (type: PostType) => void;
  mediaItems: MediaPickerItem[];
  onPickMedia: () => void;
  onRemoveMedia: (index: number) => void;
}

export function PostForm({
  avatarUrl,
  content,
  onContentChange,
  postType,
  onPostTypeChange,
  mediaItems,
  onPickMedia,
  onRemoveMedia,
}: PostFormProps) {
  const hasMedia = mediaItems.length > 0;
  const canAddMore = mediaItems.length < MAX_MEDIA_ITEMS;

  // Generate local thumbnails for video items
  const [videoThumbs, setVideoThumbs] = useState<Record<string, string>>({});
  const generatingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const item of mediaItems) {
      if (item.type === "video" && !videoThumbs[item.uri] && !generatingRef.current.has(item.uri)) {
        generatingRef.current.add(item.uri);
        ExpoVideoThumbnails.getThumbnailAsync(item.uri, { time: 500 })
          .then(({ uri }) => setVideoThumbs((prev) => ({ ...prev, [item.uri]: uri })))
          .catch(() => {});
      }
    }
  }, [mediaItems]);

  return (
    <>
      {/* Composer: Avatar + Text Input */}
      <View style={styles.composerRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.composerAvatar} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.composerAvatar, styles.composerAvatarPlaceholder]}>
            <SFIcon name="person.fill" fallback="person" size={20} color={colors.gray400} />
          </View>
        )}
        <View style={styles.composerInputWrapper}>
          <TextInput
            style={styles.composerInput}
            placeholder="What do you recommend?"
            placeholderTextColor={colors.gray400}
            multiline
            value={content}
            onChangeText={(text) => onContentChange(text.slice(0, MAX_CONTENT_LENGTH))}
            textAlignVertical="top"
            maxLength={MAX_CONTENT_LENGTH}
          />
          <Text style={styles.charCount}>
            {content.length}/{MAX_CONTENT_LENGTH}
          </Text>
        </View>
      </View>

      {/* Post Type Selector - compact pills */}
      <View style={styles.typePillRow}>
        {POST_TYPES.map((item) => (
          <HapticPressable
            key={item.type}
            style={[
              styles.typePill,
              postType === item.type && styles.typePillActive,
            ]}
            onPress={() => {
              onPostTypeChange(item.type);
              // Clear all media when switching types
              for (let i = mediaItems.length - 1; i >= 0; i--) {
                onRemoveMedia(i);
              }
            }}
          >
            <SFIcon
              name={item.icon.sf}
              fallback={item.icon.fallback}
              size={16}
              color={postType === item.type ? colors.primary : colors.gray500}
            />
            <Text
              style={[
                styles.typePillLabel,
                postType === item.type && styles.typePillLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </HapticPressable>
        ))}
      </View>

      {/* Media Section */}
      {postType !== "text" &&
        (hasMedia ? (
          <View style={styles.mediaStripContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaStripContent}
            >
              {mediaItems.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.mediaThumbnailWrapper}>
                  {item.type === "video" ? (
                    <VideoThumbnail thumbnailUrl={videoThumbs[item.uri]} style={styles.mediaThumbnail} />
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} contentFit="cover" transition={200} />
                  )}
                  <HapticPressable
                    style={styles.mediaRemoveButton}
                    onPress={() => onRemoveMedia(index)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <SFIcon name="xmark.circle.fill" fallback="close-circle" size={20} color="rgba(0,0,0,0.7)" />
                  </HapticPressable>
                  {item.type === "video" && (
                    <View style={styles.thumbnailVideoIcon}>
                      <SFIcon name="play.fill" fallback="play" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ))}
              {canAddMore && (
                <HapticPressable style={styles.addMediaButton} onPress={onPickMedia}>
                  <SFIcon name="plus" fallback="add" size={24} color={colors.gray400} />
                </HapticPressable>
              )}
            </ScrollView>
            <Text style={styles.mediaCounter}>
              {mediaItems.length}/{MAX_MEDIA_ITEMS}
            </Text>
          </View>
        ) : (
          <HapticPressable style={styles.mediaButton} onPress={onPickMedia}>
            <SFIcon
              name="camera.fill"
              fallback="camera"
              size={28}
              color={colors.gray400}
            />
            <Text style={styles.mediaButtonText}>
              Add photos & videos
            </Text>
          </HapticPressable>
        ))}
    </>
  );
}

const styles = StyleSheet.create({
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.gray100,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 2,
  },
  composerAvatarPlaceholder: {
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInputWrapper: {
    flex: 1,
  },
  composerInput: {
    fontSize: 16,
    color: colors.text,
    fontFamily: "PlusJakartaSans_500Medium",
    minHeight: 80,
    paddingTop: 0,
    paddingBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },
  typePillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typePillActive: {
    backgroundColor: colors.primary + "12",
  },
  typePillLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.gray500,
  },
  typePillLabelActive: {
    color: colors.primary,
  },
  mediaButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    overflow: "hidden",
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray500,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  mediaStripContainer: {
    marginTop: 16,
  },
  mediaStripContent: {
    gap: 8,
    paddingRight: 4,
  },
  mediaThumbnailWrapper: {
    position: "relative",
  },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: colors.gray200,
  },
  mediaRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 10,
  },
  thumbnailVideoIcon: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderStyle: "dashed",
  },
  mediaCounter: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "right",
  },
});
