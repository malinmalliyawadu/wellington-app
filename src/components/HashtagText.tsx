import React from 'react';
import { Text, type TextStyle, type StyleProp } from 'react-native';
import { parseRichText } from '../utils/hashtags';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';

interface HashtagTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onPressHashtag?: (tag: string) => void;
  onPressMention?: (username: string) => void;
}

/**
 * Renders text with tappable #hashtags and @mentions.
 * Exported as both `RichText` and `HashtagText` for backward compat.
 */
export function RichText({ children, style, numberOfLines, onPressHashtag, onPressMention }: HashtagTextProps) {
  const { colors } = useTheme();
  const segments = parseRichText(children);

  const highlightStyle: TextStyle = {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  };

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((segment, index) => {
        if (segment.type === 'hashtag') {
          return (
            <Text
              key={index}
              style={highlightStyle}
              onPress={onPressHashtag ? () => onPressHashtag(segment.value.toLowerCase()) : undefined}
            >
              #{segment.value}
            </Text>
          );
        }
        if (segment.type === 'mention') {
          return (
            <Text
              key={index}
              style={highlightStyle}
              onPress={onPressMention ? () => onPressMention(segment.value.toLowerCase()) : undefined}
            >
              @{segment.value}
            </Text>
          );
        }
        return segment.value;
      })}
    </Text>
  );
}

/** @deprecated Use `RichText` instead */
export const HashtagText = RichText;
