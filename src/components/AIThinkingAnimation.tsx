import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { SFIcon } from "./SFIcon";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

const SPARKLE_COUNT = 3;
const ORBIT_RADIUS = 24;

function OrbitingSparkle({ index, color }: { index: number; color: string }) {
  const rotation = useSharedValue(index * (360 / SPARKLE_COUNT));
  const sparkleOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Each dot orbits at a slightly different speed for organic feel
    const duration = 2000 + index * 400;
    rotation.value = withRepeat(
      withTiming(rotation.value + 360, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    sparkleOpacity.value = withRepeat(
      withSequence(
        withDelay(
          index * 200,
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const angle = (rotation.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: Math.cos(angle) * ORBIT_RADIUS },
        { translateY: Math.sin(angle) * ORBIT_RADIUS },
      ],
      opacity: sparkleOpacity.value,
    };
  });

  const size = 6 - index;

  return (
    <Animated.View
      style={[
        styles.sparkle,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

export function AIThinkingAnimation() {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);
  const textOpacity = useSharedValue(0.6);

  useEffect(() => {
    // Breathing scale
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // Pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // Shimmer text
    textOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {/* Glow ring */}
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: colors.primary },
            glowStyle,
          ]}
        />
        {/* Orbiting sparkles */}
        {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
          <OrbitingSparkle key={i} index={i} color={colors.primary} />
        ))}
        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary },
            avatarStyle,
          ]}
        >
          <SFIcon name="sparkles" fallback="sparkles" size={16} color="#FFFFFF" />
        </Animated.View>
      </View>
      <Animated.Text
        style={[
          styles.thinkingText,
          { color: colors.textSecondary },
          textStyle,
        ]}
      >
        Thinking...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sparkle: {
    position: "absolute",
    zIndex: 0,
  },
  thinkingText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
});
