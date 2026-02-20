import React from 'react';
import { Text, type TextStyle, type StyleProp } from 'react-native';
import { parseTextWithHashtags } from '../utils/hashtags';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface HashtagTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onPressHashtag?: (tag: string) => void;
}

export function HashtagText({ children, style, numberOfLines, onPressHashtag }: HashtagTextProps) {
  const segments = parseTextWithHashtags(children);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((segment, index) =>
        segment.type === 'hashtag' ? (
          <Text
            key={index}
            style={hashtagStyle}
            onPress={onPressHashtag ? () => onPressHashtag(segment.value.toLowerCase()) : undefined}
          >
            #{segment.value}
          </Text>
        ) : (
          segment.value
        )
      )}
    </Text>
  );
}

const hashtagStyle: TextStyle = {
  color: colors.primary,
  fontFamily: fonts.semiBold,
};
