import { Platform, StyleProp, ViewStyle } from 'react-native';
import { SymbolView, SFSymbol, SymbolWeight } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';

interface SFIconProps {
  name: SFSymbol;
  fallback: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
}

export function SFIcon({ name, fallback, size = 24, color, weight, style }: SFIconProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name}
        size={size}
        tintColor={color}
        weight={weight}
        style={style}
      />
    );
  }
  return <Ionicons name={fallback} size={size} color={color} style={style as any} />;
}
