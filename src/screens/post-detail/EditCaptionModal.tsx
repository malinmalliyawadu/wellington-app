import React from "react";
import { View, Text, TextInput, Modal } from "react-native";
import { HapticPressable } from "../../components/HapticPressable";
import type { Colors } from "../../theme/ThemeContext";
import type { createStyles } from "./postDetailStyles";

type Props = {
  visible: boolean;
  editContent: string;
  onChangeContent: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
  colors: Colors;
  styles: ReturnType<typeof createStyles>;
};

export function EditCaptionModal({
  visible,
  editContent,
  onChangeContent,
  onClose,
  onSave,
  colors,
  styles,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit caption</Text>
          <TextInput
            style={styles.modalInput}
            value={editContent}
            onChangeText={onChangeContent}
            multiline
            autoFocus
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.modalButtons}>
            <HapticPressable
              style={styles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </HapticPressable>
            <HapticPressable
              style={[
                styles.modalSaveButton,
                !editContent.trim() && { opacity: 0.5 },
              ]}
              onPress={onSave}
              disabled={!editContent.trim()}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </HapticPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
