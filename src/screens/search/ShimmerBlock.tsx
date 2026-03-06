import React from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Colors } from "../../theme/ThemeContext";

export function ShimmerBlock({
  width,
  height,
  borderRadius = 8,
  style,
  colors,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  colors: Colors;
}) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.gray200,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
