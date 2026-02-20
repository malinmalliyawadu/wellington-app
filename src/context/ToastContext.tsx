import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbol } from 'expo-symbols';
import { SFIcon } from '../components/SFIcon';
import { fonts } from "../theme/fonts";
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export interface ToastConfig {
  message: string;
  type?: 'default' | 'achievement' | 'error';
  duration?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  sfIcon?: SFSymbol;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({ message: '' });
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    Animated.spring(translateY, {
      toValue: -100,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
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
      if (Platform.OS === 'ios') {
        if (toastConfig.type === 'achievement') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (toastConfig.type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  const getToastStyle = () => {
    switch (config.type) {
      case 'achievement':
        return styles.achievementToast;
      case 'error':
        return styles.errorToast;
      default:
        return styles.defaultToast;
    }
  };

  const getIcon = (): { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap } => {
    if (config.icon) return { sf: config.sfIcon ?? 'checkmark.circle.fill', fallback: config.icon };

    switch (config.type) {
      case 'achievement':
        return { sf: 'trophy.fill', fallback: 'trophy' };
      case 'error':
        return { sf: 'exclamationmark.circle.fill', fallback: 'alert-circle' };
      default:
        return { sf: 'checkmark.circle.fill', fallback: 'checkmark-circle' };
    }
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
          {config.type === 'achievement' ? (
            <TouchableOpacity activeOpacity={0.9} onPress={hideToast}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.toast, styles.achievementToastGradient]}
              >
                <View style={styles.achievementIconContainer}>
                  <SFIcon name={getIcon().sf} fallback={getIcon().fallback} size={28} color="#fff" />
                </View>
                <Text style={[styles.message, styles.achievementMessage]} numberOfLines={2}>
                  {config.message}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={hideToast}
              style={[styles.toast, getToastStyle()]}
            >
              <SFIcon name={getIcon().sf} fallback={getIcon().fallback} size={24} color="#fff" style={styles.icon} />
              <Text style={styles.message} numberOfLines={2}>
                {config.message}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: width - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  defaultToast: {
    backgroundColor: colors.text,
  },
  achievementToast: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  achievementToastGradient: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  achievementIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  achievementMessage: {
    fontSize: 16,
    fontFamily: fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorToast: {
    backgroundColor: '#E74C3C',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#fff',
  },
});
