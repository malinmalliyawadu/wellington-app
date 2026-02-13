import React from "react";
import {
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";
import type { PlaceCategory } from "../types";

type ButtonSize = "small" | "medium" | "large";
type ButtonVariant = "primary" | "secondary" | "category";

interface LiquidGlassButtonProps {
  /** Button text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Optional icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
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

export function LiquidGlassButton({
  title,
  onPress,
  icon,
  size = "medium",
  variant = "primary",
  category,
  backgroundColor,
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}: LiquidGlassButtonProps) {
  const sizeStyles = SIZE_STYLES[size];
  const iconSize = ICON_SIZES[size];

  // Determine background color
  let bgColor = colors.primary; // default
  if (backgroundColor) {
    bgColor = backgroundColor;
  } else if (variant === "category" && category) {
    bgColor = colors.category[category];
  } else if (variant === "secondary") {
    bgColor = "transparent";
  }

  // Determine border color
  const borderColor =
    variant === "secondary"
      ? colors.primary
      : "rgba(255, 255, 255, 0.3)";

  // Determine text and icon color
  const contentColor = variant === "secondary" ? colors.primary : "#FFFFFF";

  // Shadow color based on variant
  const shadowColor =
    variant === "secondary" ? "#000" : backgroundColor || bgColor;

  const isDisabled = disabled || loading;

  return (
    <HapticPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        sizeStyles.container,
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
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, sizeStyles.text, { color: contentColor }]}>
            {title}
          </Text>
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
      fontWeight: "600",
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
      fontWeight: "600",
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
      fontWeight: "600",
    },
  },
};

const ICON_SIZES: Record<ButtonSize, number> = {
  small: 16,
  medium: 18,
  large: 20,
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
