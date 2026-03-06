import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { TapGestureHandler, State } from "react-native-gesture-handler";
import type { GestureEvent, TapGestureHandlerEventPayload } from "react-native-gesture-handler";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import { MediaCarousel } from "../../components/MediaCarousel";
import { VideoPlayer } from "../../components/VideoPlayer";
import { ZoomableImage } from "../../components/ZoomableImage";
import { formatTimeAgo } from "./formatTimeAgo";
import type { MediaItem } from "../../types/Post";
import type { User } from "../../types/User";
import type { ViewStyle } from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";
import type { createStyles } from "./postDetailStyles";

type Props = {
  post: { type: string; userId: string; createdAt: string };
  user: User | null | undefined;
  mediaItems: MediaItem[];
  aspectRatio: number;
  onAspectRatioChange: (ratio: number) => void;
  onImageLoad: (event: any) => void;
  onVideoLoad: (event: { width: number; height: number }) => void;
  onPressUser: (userId: string) => void;
  doubleTapRef: React.RefObject<TapGestureHandler | null>;
  handleDoubleTap: () => void;
  heartOverlayStyle: AnimatedStyle<ViewStyle>;
  styles: ReturnType<typeof createStyles>;
};

export function PostMediaSection({
  post,
  user,
  mediaItems,
  aspectRatio,
  onAspectRatioChange,
  onImageLoad,
  onVideoLoad,
  onPressUser,
  doubleTapRef,
  handleDoubleTap,
  heartOverlayStyle,
  styles,
}: Props) {
  const isMultiMedia = mediaItems.length > 1;

  return (
    <TapGestureHandler
      ref={doubleTapRef}
      numberOfTaps={2}
      onHandlerStateChange={({ nativeEvent }: GestureEvent<TapGestureHandlerEventPayload>) => {
        if (nativeEvent.state === State.ACTIVE) {
          handleDoubleTap();
        }
      }}
    >
      <View>
        {isMultiMedia ? (
          <MediaCarousel
            mediaItems={mediaItems}
            aspectRatio={aspectRatio}
            onAspectRatioChange={onAspectRatioChange}
            videoMuted={false}
            videoControls
          />
        ) : post.type === "video" ? (
          <VideoPlayer
            uri={mediaItems[0].mediaUrl}
            style={[styles.media, { aspectRatio }]}
            shouldPlay
            useNativeControls
            onLoad={onVideoLoad}
          />
        ) : (
          <ZoomableImage
            source={{ uri: mediaItems[0].mediaUrl }}
            style={[styles.media, { aspectRatio }]}
            onLoad={onImageLoad}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.05)", "transparent"]}
          locations={[0, 0.6, 0.7]}
          style={styles.headerOverlay}
        >
          <HapticPressable
            style={styles.overlaidHeaderUser}
            onPress={() => onPressUser(post.userId)}
          >
            <Image
              source={{ uri: user?.avatarUrl }}
              style={styles.overlaidAvatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.headerText}>
              <Text style={styles.overlaidDisplayName}>
                {user?.displayName ?? "Unknown"}
              </Text>
              <Text style={styles.overlaidUsername}>
                @{user?.username ?? "unknown"}
              </Text>
            </View>
          </HapticPressable>
          <Text style={styles.overlaidTimeAgo}>
            {formatTimeAgo(post.createdAt)}
          </Text>
        </LinearGradient>
        {/* Double-tap heart overlay */}
        <Animated.View
          style={[styles.heartOverlay, heartOverlayStyle]}
          pointerEvents="none"
        >
          <SFIcon
            name="heart.fill"
            fallback="heart"
            size={80}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
    </TapGestureHandler>
  );
}
