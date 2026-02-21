import React from "react";
import {
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  PlatformColor,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../theme/fonts";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { HapticPressable } from "./HapticPressable";
import { useTheme } from "../theme/ThemeContext";
import type { PlaceCategory } from "../types";

type ButtonSize = "small" | "medium" | "large";
type ButtonVariant = "primary" | "secondary" | "category";

interface LiquidGlassButtonProps {
  /** Button text (optional when iconOnly is true) */
  title?: string;
  /** Press handler */
  onPress: () => void;
  /** Optional icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon-only circular button */
  iconOnly?: boolean;
  /** Button size - default: medium */
  size?: ButtonSize;
  /** Button variant - default: primary */
  variant?: ButtonVariant;
  /** Category color (only used when variant="category") */
  category?: PlaceCategory;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Full width button */
  fullWidth?: boolean;
}

const glassEnabled = isLiquidGlassAvailable();

export function LiquidGlassButton({
  title,
  onPress,
  icon,
  iconOnly = false,
  size = "medium",
  variant = "primary",
  category,
  backgroundColor,
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}: LiquidGlassButtonProps) {
  const { colors } = useTheme();
  const sizeStyles = SIZE_STYLES[size];
  const iconSize = ICON_SIZES[size];
  const circleSize = CIRCLE_SIZES[size];
  const isDisabled = disabled || loading;

  // --- Glass path ---
  if (glassEnabled) {
    let labelColor: string | ReturnType<typeof PlatformColor> =
      Platform.OS === "ios" ? PlatformColor("label") : colors.text;
    if (backgroundColor) {
      labelColor = backgroundColor;
    } else if (variant === "primary") {
      labelColor = colors.primary;
    } else if (variant === "category" && category) {
      labelColor = colors.category[category];
    }

    return (
      <HapticPressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          { opacity: isDisabled ? 0.6 : 1 },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        <GlassView
          isInteractive
          glassEffectStyle="regular"
          style={[
            styles.button,
            iconOnly
              ? { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }
              : sizeStyles.container,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={labelColor} />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={iconSize}
                  color={labelColor}
                  style={!iconOnly ? styles.icon : undefined}
                />
              )}
              {!iconOnly && (
                <Text style={[styles.text, sizeStyles.text, { color: labelColor }]}>
                  {title}
                </Text>
              )}
            </>
          )}
        </GlassView>
      </HapticPressable>
    );
  }

  // --- Fallback path (Android / older iOS) ---
  let bgColor = colors.primary;
  if (backgroundColor) {
    bgColor = backgroundColor;
  } else if (variant === "category" && category) {
    bgColor = colors.category[category];
  } else if (variant === "secondary") {
    bgColor = "transparent";
  }

  const borderColor =
    variant === "secondary" ? colors.primary : "rgba(255, 255, 255, 0.3)";
  const contentColor = variant === "secondary" ? colors.primary : "#FFFFFF";
  const shadowColor =
    variant === "secondary" ? "#000" : backgroundColor || bgColor;

  return (
    <HapticPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        styles.fallbackButton,
        iconOnly
          ? { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }
          : sizeStyles.container,
        {
          backgroundColor: bgColor,
          borderColor,
          shadowColor,
          opacity: isDisabled ? 0.6 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={contentColor}
              style={!iconOnly ? styles.icon : undefined}
            />
          )}
          {!iconOnly && (
            <Text style={[styles.text, sizeStyles.text, { color: contentColor }]}>
              {title}
            </Text>
          )}
        </>
      )}
    </HapticPressable>
  );
}

const SIZE_STYLES: Record<
  ButtonSize,
  { container: ViewStyle; text: TextStyle }
> = {
  small: {
    container: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    text: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
    },
  },
  medium: {
    container: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    text: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
    },
  },
  large: {
    container: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      gap: 8,
    },
    text: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
    },
  },
};

const ICON_SIZES: Record<ButtonSize, number> = {
  small: 16,
  medium: 18,
  large: 20,
};

const CIRCLE_SIZES: Record<ButtonSize, number> = {
  small: 32,
  medium: 40,
  large: 48,
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fallbackButton: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    color: "#FFFFFF",
  },
  icon: {
    marginRight: 0,
  },
});
