import { StyleSheet } from "react-native";
import { fonts } from "../../theme/fonts";
import type { Colors } from "../../theme/ThemeContext";

const createMarkdownStyles = (colors: Colors) =>
  StyleSheet.create({
    body: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      lineHeight: 22,
    },
    strong: {
      fontFamily: fonts.bold,
    },
    em: {
      fontStyle: "italic",
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
    },
    link: {
      color: colors.primary,
    },
  });

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    headerButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 16,
      gap: 16,
    },
    scrollContentIdle: {
      flexGrow: 1,
    },
    // Idle state
    idleContainer: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: 24,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginTop: 24,
    },
    chip: {
      backgroundColor: colors.primary + "12",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary + "30",
      width: "47%",
    },
    chipLabel: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    chipDescription: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 2,
    },
    // Message bubbles
    questionBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      maxWidth: "80%",
    },
    questionText: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: "#FFFFFF",
    },
    // AI response
    aiResponseSection: {
      gap: 12,
    },
    aiAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    aiAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    aiLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    aiMessage: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      lineHeight: 22,
    },
    cardsSection: {
      gap: 8,
      marginTop: 4,
    },
    followUpSection: {
      gap: 10,
      marginTop: 4,
    },
    followUpQuestion: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    followUpChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    followUpChip: {
      backgroundColor: colors.primary + "12",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    followUpChipText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Error state
    errorBox: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 24,
    },
    errorText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryButtonText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
    },
    // Input bar
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      backgroundColor: colors.gray100,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 40,
    },
    sendButton: {
      padding: 2,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    // Recommendation cards
    recCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.gray100,
      borderRadius: 14,
      padding: 12,
      gap: 12,
    },
    recIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    recCardContent: {
      flex: 1,
      gap: 2,
    },
    recCardTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    recCardDate: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    recCardReason: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });

export { createStyles, createMarkdownStyles };
