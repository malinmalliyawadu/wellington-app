import React, { useRef } from "react";
import { ImageProps, ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  measure,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useZoomOverlay } from "../context/ZoomOverlayContext";

const RESET_CONFIG = { duration: 200, easing: Easing.out(Easing.quad) };
const MAX_SCALE = 5;

export function ZoomableImage({ style, source, ...props }: ImageProps) {
  const overlay = useZoomOverlay();
  const wrapperRef = useAnimatedRef<Animated.View>();
  const active = useSharedValue(false);
  const sourceRef = useRef<ImageSourcePropType | undefined>(source);
  sourceRef.current = source;

  const showOverlayImage = () => overlay.showImage(sourceRef.current!);
  const hideOverlayImage = () => overlay.hideImage();

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      active.value = true;
      const layout = measure(wrapperRef);
      if (layout) {
        overlay.originX.value = layout.pageX;
        overlay.originY.value = layout.pageY;
        overlay.originWidth.value = layout.width;
        overlay.originHeight.value = layout.height;
      }
      overlay.scale.value = 1;
      overlay.translateX.value = 0;
      overlay.translateY.value = 0;
      runOnJS(showOverlayImage)();
    })
    .onUpdate((e) => {
      overlay.scale.value = Math.min(Math.max(e.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      overlay.scale.value = withTiming(1, RESET_CONFIG);
      overlay.translateX.value = withTiming(0, RESET_CONFIG);
      overlay.translateY.value = withTiming(0, RESET_CONFIG, () => {
        active.value = false;
        runOnJS(hideOverlayImage)();
      });
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      overlay.translateX.value = e.translationX;
      overlay.translateY.value = e.translationY;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  // Original image transforms for instant feedback while overlay catches up
  const animatedStyle = useAnimatedStyle(() => {
    if (!active.value) {
      return { transform: [{ scale: 1 }] };
    }
    return {
      transform: [
        { translateX: overlay.translateX.value },
        { translateY: overlay.translateY.value },
        { scale: overlay.scale.value },
      ],
    };
  });

  return (
    <Animated.View ref={wrapperRef}>
      <GestureDetector gesture={composed}>
        <Animated.Image source={source} style={[style, animatedStyle]} {...props} />
      </GestureDetector>
    </Animated.View>
  );
}
