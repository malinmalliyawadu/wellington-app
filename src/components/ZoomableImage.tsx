import React, { useRef, useState } from "react";
import { ImageProps, ImageSourcePropType, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  measure,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useZoomOverlay } from "../context/ZoomOverlayContext";

const RESET_CONFIG = { duration: 200, easing: Easing.out(Easing.quad) };
const MAX_SCALE = 5;

export function ZoomableImage({ style, source, onError, ...props }: ImageProps) {
  const { colors } = useTheme();
  const zoomStyles = createZoomStyles(colors);
  const overlay = useZoomOverlay();
  const wrapperRef = useAnimatedRef<Animated.View>();
  const localActive = useSharedValue(false);
  const sourceRef = useRef<ImageSourcePropType | undefined>(source);
  const [hasError, setHasError] = useState(false);
  sourceRef.current = source;

  const uri = source && typeof source === "object" && !Array.isArray(source) ? (source as { uri?: string }).uri : undefined;

  const updateSource = () => {
    overlay.setSource(sourceRef.current!);
    overlay.active.value = 1;
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      localActive.value = true;
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
      // Source + visibility update together on JS thread
      scheduleOnRN(updateSource);
    })
    .onUpdate((e) => {
      overlay.scale.value = Math.min(Math.max(e.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      overlay.scale.value = withTiming(1, RESET_CONFIG);
      overlay.translateX.value = withTiming(0, RESET_CONFIG);
      overlay.translateY.value = withTiming(0, RESET_CONFIG, () => {
        overlay.active.value = 0;
        localActive.value = false;
      });
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      overlay.translateX.value = e.translationX;
      overlay.translateY.value = e.translationY;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  // Original image also transforms for instant feedback
  const animatedStyle = useAnimatedStyle(() => {
    if (!localActive.value) {
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

  if (!uri || hasError) {
    return (
      <View style={[style, zoomStyles.fallback]}>
        <Ionicons name="image-outline" size={40} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Animated.View ref={wrapperRef}>
      <GestureDetector gesture={composed}>
        <Animated.Image
          source={source}
          style={[style, animatedStyle]}
          onError={(e) => {
            setHasError(true);
            onError?.(e);
          }}
          {...props}
        />
      </GestureDetector>
    </Animated.View>
  );
}

const createZoomStyles = (colors: Colors) => StyleSheet.create({
  fallback: {
    backgroundColor: colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
});
