import { View, Text, StyleSheet } from "react-native";
import { useNetwork } from "../context/NetworkContext";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { HapticPressable } from "./HapticPressable";
import { SFIcon } from "./SFIcon";
import { fonts } from "../theme/fonts";

interface QueryErrorStateProps {
  message?: string | null;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function QueryErrorState({
  message,
  onRetry,
  fullScreen = true,
}: QueryErrorStateProps) {
  const { isConnected } = useNetwork();
  const { colors } = useTheme();
  const styles = createStyles(colors, fullScreen);

  const isOffline = !isConnected;
  const title = isOffline ? "You're offline" : "Something went wrong";
  const subtitle = isOffline
    ? "Check your connection and try again"
    : message || "An unexpected error occurred";

  return (
    <View style={styles.container}>
      <SFIcon
        name={isOffline ? "wifi.slash" : "exclamationmark.triangle.fill"}
        fallback={isOffline ? "cloud-offline-outline" : "warning-outline"}
        size={40}
        color={colors.textMuted}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{subtitle}</Text>
      {onRetry && (
        <HapticPressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </HapticPressable>
      )}
    </View>
  );
}

const createStyles = (colors: Colors, fullScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: fullScreen ? 1 : undefined,
      backgroundColor: fullScreen ? colors.background : undefined,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    title: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
    },
  });
