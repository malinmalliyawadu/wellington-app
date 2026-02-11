import React from 'react';
import { GestureResponderEvent, Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export const HapticPressable = ({ onPress, children, style }: PressableProps) => {
    const handlePress = (event: GestureResponderEvent) => {
        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress(event);
    };

    return (
        <Pressable
            onPress={handlePress}
            style={(state) => [
                typeof style === 'function' ? style(state) : style,
                state.pressed && { opacity: 0.7 }
            ]}
        >
            {children}
        </Pressable>
    );
};
