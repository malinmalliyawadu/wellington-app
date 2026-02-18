import React from "react";
import { View, Text, TextInput, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../SFIcon";
import { HapticPressable } from "../HapticPressable";
import { VideoPlayer } from "../VideoPlayer";
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

interface PostFormProps {
  avatarUrl?: string;
  content: string;
  onContentChange: (text: string) => void;
  postType: PostType;
  onPostTypeChange: (type: PostType) => void;
  mediaUri: string | null;
  onPickMedia: () => void;
  onClearMedia: () => void;
}

export function PostForm({
  avatarUrl,
  content,
  onContentChange,
  postType,
  onPostTypeChange,
  mediaUri,
  onPickMedia,
  onClearMedia,
}: PostFormProps) {
  return (
    <>
      {/* Composer: Avatar + Text Input */}
      <View style={styles.composerRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.composerAvatar} />
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
              onClearMedia();
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
        (mediaUri ? (
          <View style={styles.mediaPreviewContainer}>
            {postType === "video" ? (
              <VideoPlayer
                uri={mediaUri}
                style={styles.mediaPreview}
                useNativeControls
                isMuted
              />
            ) : (
              <HapticPressable onPress={onPickMedia}>
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              </HapticPressable>
            )}
            <HapticPressable style={styles.mediaChangeButton} onPress={onPickMedia}>
              <SFIcon name="arrow.triangle.2.circlepath" fallback="refresh" size={14} color={colors.primary} />
              <Text style={styles.mediaChangeText}>Change</Text>
            </HapticPressable>
          </View>
        ) : (
          <HapticPressable style={styles.mediaButton} onPress={onPickMedia}>
            <SFIcon
              name={postType === "photo" ? "camera.fill" : "video.fill"}
              fallback={postType === "photo" ? "camera" : "videocam"}
              size={28}
              color={colors.gray400}
            />
            <Text style={styles.mediaButtonText}>
              Add a {postType === "photo" ? "photo" : "video"}
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
  mediaPreviewContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  mediaChangeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary + "10",
  },
  mediaChangeText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.primary,
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray500,
    fontFamily: "PlusJakartaSans_500Medium",
  },
});
