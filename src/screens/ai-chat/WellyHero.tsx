import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { SFIcon } from "../../components/SFIcon";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";
import { getGreeting } from "./chatHelpers";

export function WellyHero({ colors, userName }: { colors: Colors; userName?: string }) {
  const glowOpacity = useSharedValue(0.15);
  const scale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.15, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1.0, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const greeting = useMemo(() => getGreeting(), []);

  return (
    <View style={heroStyles.container}>
      <View style={heroStyles.avatarWrapper}>
        <Animated.View
          style={[
            heroStyles.glow,
            { backgroundColor: colors.primary },
            glowStyle,
          ]}
        />
        <Animated.View
          style={[
            heroStyles.avatar,
            { backgroundColor: colors.primary },
            avatarStyle,
          ]}
        >
          <SFIcon
            name="sparkles"
            fallback="sparkles"
            size={22}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
      <Text style={[heroStyles.brandName, { color: colors.text }]}>Welly</Text>
      <Text style={heroStyles.greeting}>
        {greeting.text}{userName ? ` ${userName}` : ""} {greeting.emoji}
      </Text>
      <Text style={[heroStyles.subtitle, { color: colors.textSecondary }]}>
        What are you keen to do in Wellington?
      </Text>
    </View>
  );
}

export const heroStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  glow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  brandName: {
    fontSize: 28,
    fontFamily: fonts.pacifico,
  },
  greeting: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: "#333",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  eventImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
