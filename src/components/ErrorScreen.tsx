import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { HapticPressable } from "./HapticPressable";

interface ErrorScreenProps {
  error: Error;
  retry: () => void;
}

export function ErrorScreen({ error, retry }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>:(</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <HapticPressable style={styles.button} onPress={retry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </HapticPressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
    color: colors.textMuted,
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#FFFFFF",
  },
});
