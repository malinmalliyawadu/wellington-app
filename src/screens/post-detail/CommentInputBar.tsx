import React from "react";
import { View, TextInput } from "react-native";
import { SFIcon } from "../../components/SFIcon";
import { HapticPressable } from "../../components/HapticPressable";
import { MentionSuggestions } from "../../components/create/MentionSuggestions";
import type { Colors } from "../../theme/ThemeContext";
import type { User } from "../../types/User";
import type { createStyles } from "./postDetailStyles";

type Props = {
  inputRef: React.RefObject<TextInput | null>;
  commentText: string;
  editingCommentId: string | null;
  inputFocused: boolean;
  bottomInset: number;
  mentionSuggestions: User[];
  onChangeText: (text: string) => void;
  onSelectionChange: (e: any) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onSelectMention: (user: { username: string }) => void;
  colors: Colors;
  styles: ReturnType<typeof createStyles>;
};

export function CommentInputBar({
  inputRef,
  commentText,
  editingCommentId,
  inputFocused,
  bottomInset,
  mentionSuggestions,
  onChangeText,
  onSelectionChange,
  onFocus,
  onBlur,
  onSubmit,
  onCancelEdit,
  onSelectMention,
  colors,
  styles,
}: Props) {
  return (
    <>
      {/* Mention suggestions above input bar */}
      {mentionSuggestions.length > 0 && (
        <View style={{ paddingHorizontal: 12 }}>
          <MentionSuggestions
            suggestions={mentionSuggestions}
            onSelect={onSelectMention}
          />
        </View>
      )}

      {/* Comment input bar */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: inputFocused ? 8 : bottomInset + 60 },
        ]}
      >
        {editingCommentId && (
          <HapticPressable
            onPress={onCancelEdit}
            style={styles.cancelButton}
          >
            <SFIcon
              name="xmark.circle.fill"
              fallback="close-circle"
              size={22}
              color={colors.textMuted}
            />
          </HapticPressable>
        )}
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          placeholder={
            editingCommentId ? "Edit comment..." : "Add a comment..."
          }
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
        />
        <HapticPressable
          onPress={onSubmit}
          disabled={!commentText.trim()}
          style={styles.sendButton}
        >
          <SFIcon
            name={
              editingCommentId ? "checkmark.circle.fill" : "paperplane.fill"
            }
            fallback={editingCommentId ? "checkmark-circle" : "send"}
            size={22}
            color={commentText.trim() ? colors.primary : colors.gray300}
          />
        </HapticPressable>
      </View>
    </>
  );
}
