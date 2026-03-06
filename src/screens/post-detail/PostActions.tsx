import React from "react";
import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import type { ViewStyle } from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";
import type { Colors } from "../../theme/ThemeContext";
import type { createStyles } from "./postDetailStyles";

type Props = {
  liked: boolean;
  likeCount: number;
  saved: boolean;
  likeAnimatedStyle: AnimatedStyle<ViewStyle>;
  postId: string;
  currentTab: string;
  onLike: () => void;
  onFocusComment: () => void;
  onShare: () => void;
  onToggleSave: () => void;
  onPressLikeCount: () => void;
  colors: Colors;
  styles: ReturnType<typeof createStyles>;
};

export function PostActions({
  liked,
  likeCount,
  saved,
  likeAnimatedStyle,
  onLike,
  onFocusComment,
  onShare,
  onToggleSave,
  onPressLikeCount,
  colors,
  styles,
}: Props) {
  return (
    <>
      {/* Actions row */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <HapticPressable style={styles.actionButton} onPress={onLike}>
            <Animated.View style={likeAnimatedStyle}>
              <SFIcon
                name={liked ? "heart.fill" : "heart"}
                fallback={liked ? "heart" : "heart-outline"}
                size={26}
                color={liked ? colors.liked : colors.text}
              />
            </Animated.View>
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={onFocusComment}
          >
            <SFIcon
              name="bubble.left"
              fallback="chatbubble-outline"
              size={24}
              color={colors.text}
            />
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={onShare}
          >
            <SFIcon
              name="paperplane"
              fallback="paper-plane-outline"
              size={24}
              color={colors.text}
            />
          </HapticPressable>
        </View>
        <HapticPressable
          onPress={onToggleSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SFIcon
            name={saved ? "bookmark.fill" : "bookmark"}
            fallback={saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={saved ? colors.saved : colors.text}
          />
        </HapticPressable>
      </View>

      {/* Like count */}
      <HapticPressable onPress={onPressLikeCount}>
        <Text style={styles.likeCount}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Text>
      </HapticPressable>
    </>
  );
}
