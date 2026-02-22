import { useRef } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useLike } from "../context/LikeContext";

export function useDoubleTapGuideLike(guideId: string) {
  const { isGuideLiked, toggleGuideLike, getGuideLikeCount } = useLike();
  const liked = isGuideLiked(guideId);
  const likeCount = getGuideLikeCount(guideId);

  const doubleTapRef = useRef(null);

  const likeScale = useSharedValue(1);
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const heartOverlayOpacity = useSharedValue(0);
  const heartOverlayScale = useSharedValue(0);
  const heartOverlayStyle = useAnimatedStyle(() => ({
    opacity: heartOverlayOpacity.value,
    transform: [{ scale: heartOverlayScale.value }],
  }));

  const animateLikeButton = () => {
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );
  };

  const handleLike = () => {
    animateLikeButton();
    toggleGuideLike(guideId);
  };

  const handleDoubleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleGuideLike(guideId);
    animateLikeButton();
    heartOverlayScale.value = 0;
    heartOverlayOpacity.value = 1;
    heartOverlayScale.value = withSpring(1, { damping: 6, stiffness: 200 });
    heartOverlayOpacity.value = withDelay(
      600,
      withTiming(0, { duration: 300 })
    );
  };

  return {
    liked,
    likeCount,
    doubleTapRef,
    likeAnimatedStyle,
    heartOverlayStyle,
    handleLike,
    handleDoubleTap,
  };
}
