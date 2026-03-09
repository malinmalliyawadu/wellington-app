import { StyleSheet } from "react-native";
import { type Colors } from "../../theme/ThemeContext";
import { fonts } from "../../theme/fonts";

export const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    alignItems: "center",
    gap: 16,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.gray100,
  },
  editTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 3,
  },
  segmentControlGlass: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentActiveGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  segmentText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  hashtagSection: {
    marginTop: 10,
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  progressText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
});
