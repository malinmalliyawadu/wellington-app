import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, NativeSyntheticEvent, TextInputSelectionChangeEventData } from "react-native";
import { Image } from "expo-image";
import * as ExpoVideoThumbnails from "expo-video-thumbnails";
import { SFIcon } from "../SFIcon";
import { HapticPressable } from "../HapticPressable";
import { VideoThumbnail } from "../VideoThumbnail";
import { useTheme, type Colors } from "../../theme/ThemeContext";

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
  onSelectionChange?: (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
  inputAccessoryViewID?: string;
  mediaItems: MediaPickerItem[];
  onPickMedia: () => void;
  onTakeMedia: () => void;
  onRemoveMedia: (index: number) => void;
  hashtagChips?: React.ReactNode;
}

export function PostForm({
  avatarUrl,
  content,
  onContentChange,
  onSelectionChange,
  inputAccessoryViewID,
  mediaItems,
  onPickMedia,
  onTakeMedia,
  onRemoveMedia,
  hashtagChips,
}: PostFormProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            onSelectionChange={onSelectionChange}
            inputAccessoryViewID={inputAccessoryViewID}
            textAlignVertical="top"
            maxLength={MAX_CONTENT_LENGTH}
          />
          <Text style={styles.charCount}>
            {content.length}/{MAX_CONTENT_LENGTH}
          </Text>
        </View>
      </View>

      {/* Hashtag Recommendations */}
      {hashtagChips}

      {/* Media Section */}
      {hasMedia ? (
          <View style={styles.mediaStripContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaStripContent}
            >
              {canAddMore && (
                <View style={styles.addMediaStack}>
                  <HapticPressable style={styles.addMediaStackButton} onPress={onTakeMedia}>
                    <SFIcon name="camera.fill" fallback="camera" size={16} color={colors.gray400} />
                  </HapticPressable>
                  <HapticPressable style={styles.addMediaStackButton} onPress={onPickMedia}>
                    <SFIcon name="plus" fallback="add" size={18} color={colors.gray400} />
                  </HapticPressable>
                </View>
              )}
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
            </ScrollView>
            <Text style={styles.mediaCounter}>
              {mediaItems.length}/{MAX_MEDIA_ITEMS}
            </Text>
          </View>
        ) : (
          <View style={styles.mediaButtonRow}>
            <HapticPressable style={styles.mediaButton} onPress={onTakeMedia}>
              <View style={styles.mediaButtonIconWrap}>
                <SFIcon
                  name="camera.fill"
                  fallback="camera"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.mediaButtonText}>
                Camera
              </Text>
            </HapticPressable>
            <HapticPressable style={styles.mediaButton} onPress={onPickMedia}>
              <View style={[styles.mediaButtonIconWrap, { backgroundColor: "#0077B6" + "14" }]}>
                <SFIcon
                  name="photo.on.rectangle"
                  fallback="images"
                  size={22}
                  color="#0077B6"
                />
              </View>
              <Text style={styles.mediaButtonText}>
                Library
              </Text>
            </HapticPressable>
          </View>
        )}
    </>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
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
    marginTop: 4,
  },
  mediaButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  mediaButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  mediaButtonIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mediaButtonText: {
    fontSize: 13,
    color: colors.gray500,
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    borderRadius: 12,
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
  addMediaStack: {
    width: 72,
    height: 100,
    gap: 6,
  },
  addMediaStackButton: {
    flex: 1,
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
