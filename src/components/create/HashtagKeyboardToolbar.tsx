import React from 'react';
import { View, Text, InputAccessoryView, ScrollView, StyleSheet, Platform } from 'react-native';
import { HapticPressable } from '../HapticPressable';
import { SFIcon } from '../SFIcon';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export const HASHTAG_TOOLBAR_ID = 'hashtag-toolbar';

interface HashtagKeyboardToolbarProps {
  chipTags: string[];
  onChipPress: (tag: string) => void;
  onHashPress: () => void;
}

function ToolbarContent({ chipTags, onChipPress, onHashPress }: HashtagKeyboardToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <HapticPressable style={styles.hashButton} onPress={onHashPress}>
        <Text style={styles.hashButtonText}>#</Text>
      </HapticPressable>
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

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  hashButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray300,
  },
  hashButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: colors.gray300,
    marginHorizontal: 8,
  },
  chipsContainer: {
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray200,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});
