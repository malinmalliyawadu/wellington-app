import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
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

function TypingDot({
  index,
  color,
  size = 7,
}: {
  index: number;
  color: string;
  size?: number;
}) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, {
            duration: 400,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function AIThinkingAnimation({
  showLabel = true,
  statusText,
}: {
  showLabel?: boolean;
  statusText?: string;
}) {
  const { colors } = useTheme();

  if (showLabel) {
    return (
      <View style={styles.container}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <SFIcon
              name="sparkles"
              fallback="sparkles"
              size={14}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Welly
          </Text>
        </View>
        <View style={[styles.bubble, { backgroundColor: colors.gray100 }]}>
          <View style={styles.bubbleDotsRow}>
            {[0, 1, 2].map((i) => (
              <TypingDot key={i} index={i} color={colors.textMuted} size={8} />
            ))}
          </View>
          {statusText ? (
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              {statusText}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.compactRow}>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <TypingDot key={i} index={i} color={colors.textMuted} />
        ))}
      </View>
      {statusText ? (
        <Text style={[styles.statusText, { color: colors.textMuted }]}>
          {statusText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  bubble: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  bubbleDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 6,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
