import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "../context/NetworkContext";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { SFIcon } from "./SFIcon";
import { fonts } from "../theme/fonts";

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isConnected ? -100 : 0,
      useNativeDriver: true,
    }).start();
  }, [isConnected, translateY]);

  const styles = createStyles(colors, insets.top);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <SFIcon
        name="wifi.slash"
        fallback="cloud-offline-outline"
        size={16}
        color="#FFFFFF"
      />
      <Text style={styles.text}>You&apos;re offline</Text>
    </Animated.View>
  );
}

const createStyles = (colors: Colors, topInset: number) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingTop: topInset + 4,
      paddingBottom: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.warning,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      zIndex: 9999,
    },
    text: {
      color: "#FFFFFF",
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },
  });
