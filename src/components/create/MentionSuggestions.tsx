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
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray200,
    overflow: 'hidden',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
  },
  textContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
