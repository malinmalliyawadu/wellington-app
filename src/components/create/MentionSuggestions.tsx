import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { HapticPressable } from '../HapticPressable';
import { useTheme, type Colors } from '../../theme/ThemeContext';
import { fonts } from '../../theme/fonts';
import type { User } from '../../types';

interface MentionSuggestionsProps {
  suggestions: User[];
  onSelect: (user: User) => void;
}

export function MentionSuggestions({ suggestions, onSelect }: MentionSuggestionsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map((user) => (
        <HapticPressable
          key={user.id}
          style={styles.row}
          onPress={() => onSelect(user)}
        >
          <Image
            source={{ uri: user.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.textContainer}>
            <Text style={styles.displayName} numberOfLines={1}>
              {user.displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
        </HapticPressable>
      ))}
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.gray100,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gray200,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  username: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
});
