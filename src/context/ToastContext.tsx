import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  PlatformColor,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../components/SFIcon";
import { fonts } from "../theme/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

const glassEnabled = isLiquidGlassAvailable();

export interface ToastConfig {
  message: string;
  title?: string;
  type?: "default" | "achievement" | "error" | "notification";
  duration?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  sfIcon?: SFSymbol;
  avatarUrl?: string;
  onPress?: () => void;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({ message: "" });
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const insets = useSafeAreaInsets();

  const labelColor = (
    Platform.OS === "ios" ? PlatformColor("label") : colors.text
  ) as string;

  const hideToast = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -300,
      useNativeDriver: true,
      duration: 250,
    }).start(() => {
      setVisible(false);
    });
  }, [translateY]);

  const showToast = useCallback(
    (toastConfig: ToastConfig) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Haptic feedback
      if (Platform.OS === "ios") {
        if (toastConfig.type === "achievement") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (toastConfig.type === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (toastConfig.type === "notification") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      setConfig(toastConfig);
      setVisible(true);

      // Animate in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 10,
      }).start();

      // Auto-hide after duration
      const duration = toastConfig.duration ?? 3500;
      timeoutRef.current = setTimeout(hideToast, duration);
    },
    [translateY, hideToast]
  );

  const getIcon = (): {
    sf: SFSymbol;
    fallback: keyof typeof Ionicons.glyphMap;
  } => {
    if (config.icon)
      return {
        sf: config.sfIcon ?? "checkmark.circle.fill",
        fallback: config.icon,
      };

    switch (config.type) {
      case "achievement":
        return { sf: "trophy.fill", fallback: "trophy" };
      case "error":
        return { sf: "exclamationmark.circle.fill", fallback: "alert-circle" };
      default:
        return { sf: "checkmark.circle.fill", fallback: "checkmark-circle" };
    }
  };

  const renderAchievementToast = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={hideToast}
      style={{ alignSelf: "stretch" }}
    >
      <LinearGradient
        colors={["#FFD700", "#FFA500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.toast, styles.achievementToastGradient]}
      >
        <View style={styles.achievementIconContainer}>
          <SFIcon
            name={getIcon().sf}
            fallback={getIcon().fallback}
            size={28}
            color="#fff"
          />
        </View>
        <View style={{ flex: 1 }}>
          {config.title && (
            <Text style={styles.achievementTitle} numberOfLines={1}>
              {config.title}
            </Text>
          )}
          <Text
            style={[styles.message, styles.achievementMessage]}
            numberOfLines={2}
          >
            {config.message}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderNotificationToast = () => {
    const iconEl = config.avatarUrl ? (
      <Image
        source={{ uri: config.avatarUrl }}
        style={styles.notificationAvatar}
      />
    ) : (
      <SFIcon
        name="bell.fill"
        fallback="notifications"
        size={24}
        color={glassEnabled ? labelColor : "#fff"}
        style={styles.icon}
      />
    );
    const textColor = glassEnabled ? labelColor : colors.background;

    if (glassEnabled) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            config.onPress?.();
            hideToast();
          }}
          style={{ alignSelf: "stretch" }}
        >
          <GlassView
            glassEffectStyle="regular"
            style={[styles.toast, styles.glassToast]}
          >
            {iconEl}
            <Text
              style={[styles.message, { color: textColor }]}
              numberOfLines={2}
            >
              {config.message}
            </Text>
          </GlassView>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          config.onPress?.();
          hideToast();
        }}
        style={[styles.toast, styles.notificationToast]}
      >
        {iconEl}
        <Text style={styles.message} numberOfLines={2}>
          {config.message}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDefaultToast = () => {
    const iconInfo = getIcon();
    const isError = config.type === "error";
    const iconColor = glassEnabled
      ? isError
        ? "#E74C3C"
        : labelColor
      : "#fff";
    const textColor = glassEnabled ? labelColor : colors.background;

    if (glassEnabled) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={hideToast}
          style={{ alignSelf: "stretch" }}
        >
          <GlassView
            glassEffectStyle="regular"
            style={[styles.toast, styles.glassToast]}
          >
            <SFIcon
              name={iconInfo.sf}
              fallback={iconInfo.fallback}
              size={24}
              color={iconColor}
              style={styles.icon}
            />
            <Text
              style={[styles.message, { color: textColor }]}
              numberOfLines={2}
            >
              {config.message}
            </Text>
          </GlassView>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[
          styles.toast,
          isError ? styles.errorToast : styles.defaultToast,
        ]}
      >
        <SFIcon
          name={iconInfo.sf}
          fallback={iconInfo.fallback}
          size={24}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={2}>
          {config.message}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.container,
            { top: insets.top + 8 },
            { transform: [{ translateY }] },
          ]}
        >
          {config.type === "achievement"
            ? renderAchievementToast()
            : config.type === "notification"
            ? renderNotificationToast()
            : renderDefaultToast()}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const { width } = Dimensions.get("window");

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 9999,
      alignItems: "center",
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      maxWidth: width - 32,
      overflow: "hidden",
    },
    glassToast: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    defaultToast: {
      backgroundColor: colors.text,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    achievementToastGradient: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderRadius: 16,
      shadowColor: "#FFA500",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    achievementIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    achievementTitle: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 2,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    achievementMessage: {
      fontSize: 16,
      fontFamily: fonts.bold,
      textShadowColor: "rgba(0, 0, 0, 0.2)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    errorToast: {
      backgroundColor: "#E74C3C",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    notificationToast: {
      backgroundColor: colors.text,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    notificationAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
      backgroundColor: colors.gray300,
    },
    icon: {
      marginRight: 12,
    },
    message: {
      flex: 1,
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.background,
    },
  });
