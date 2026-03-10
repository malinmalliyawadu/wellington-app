import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { SFIcon } from "../../components/SFIcon";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";
import { getGreeting } from "./chatHelpers";

export function WellyHero({ colors, userName }: { colors: Colors; userName?: string }) {
  const innerGlow = useSharedValue(0.15);
  const outerGlow = useSharedValue(0.06);
  const scale = useSharedValue(1);

  useEffect(() => {
    innerGlow.value = withRepeat(
      withSequence(
        withTiming(0.4, {
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
    outerGlow.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(0.18, {
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.06, {
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, {
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1.0, {
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value,
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: outerGlow.value,
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
            heroStyles.outerGlow,
            { backgroundColor: colors.primary },
            outerGlowStyle,
          ]}
        />
        <Animated.View
          style={[
            heroStyles.innerGlow,
            { backgroundColor: colors.primary },
            innerGlowStyle,
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
            size={26}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
      <Text style={[heroStyles.brandName, { color: colors.text }]}>Welly</Text>
      <Text style={[heroStyles.greeting, { color: colors.text }]}>
        {greeting.text}{userName ? `, ${userName}` : ""}! {greeting.emoji}
      </Text>
      <Text style={[heroStyles.subtitle, { color: colors.textMuted }]}>
        Your Wellington guide — ask me anything
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
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  outerGlow: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  innerGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  brandName: {
    fontSize: 32,
    fontFamily: fonts.pacifico,
  },
  greeting: {
    fontSize: 18,
    fontFamily: fonts.bold,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
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
    borderRadius: 20,
  },
  eventImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
