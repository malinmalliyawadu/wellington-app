import React from 'react';
import { View, Text, InputAccessoryView, ScrollView, StyleSheet, Platform } from 'react-native';
import { HapticPressable } from '../HapticPressable';
import { SFIcon } from '../SFIcon';
import { useTheme, type Colors } from '../../theme/ThemeContext';
import { fonts } from '../../theme/fonts';

export const HASHTAG_TOOLBAR_ID = 'hashtag-toolbar';

interface HashtagKeyboardToolbarProps {
  chipTags: string[];
  onChipPress: (tag: string) => void;
  onHashPress: () => void;
  onAtPress?: () => void;
}

function ToolbarContent({ chipTags, onChipPress, onHashPress, onAtPress }: HashtagKeyboardToolbarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.toolbar}>
      <HapticPressable style={styles.hashButton} onPress={onHashPress}>
        <SFIcon name="number" fallback="pricetag" size={18} color={colors.primary} />
      </HapticPressable>
      {onAtPress && (
        <HapticPressable style={styles.hashButton} onPress={onAtPress}>
          <SFIcon name="at" fallback="at" size={18} color={colors.primary} />
        </HapticPressable>
      )}
      {chipTags.length > 0 && (
        <>
          <View style={styles.divider} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chipsContainer}
          >
            {chipTags.map((tag) => (
              <HapticPressable
                key={tag}
                style={styles.chip}
                onPress={() => onChipPress(tag)}
              >
                <SFIcon name="number" fallback="pricetag" size={11} color={colors.primary} />
                <Text style={styles.chipText}>{tag}</Text>
              </HapticPressable>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

export function HashtagKeyboardToolbar(props: HashtagKeyboardToolbarProps) {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={HASHTAG_TOOLBAR_ID}>
      <ToolbarContent {...props} />
    </InputAccessoryView>
  );
}

export function HashtagInlineToolbar(props: HashtagKeyboardToolbarProps) {
  return <ToolbarContent {...props} />;
}

const createStyles = (colors: Colors) => StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  hashButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashButtonText: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.primary,
    includeFontPadding: false,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: colors.gray200,
    marginHorizontal: 2,
  },
  chipsContainer: {
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
});
