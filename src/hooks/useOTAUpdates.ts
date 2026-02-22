import { useEffect } from "react";
import { Alert, AppState } from "react-native";
import * as Updates from "expo-updates";

export function useOTAUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    async function checkForUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            "Update Available",
            "A new version has been downloaded. Restart now to apply it?",
            [
              { text: "Later", style: "cancel" },
              { text: "Restart", onPress: () => Updates.reloadAsync() },
            ]
          );
        }
      } catch {
        // Silently ignore update check failures
      }
    }

    // Check on mount
    checkForUpdate();

    // Check when app returns to foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkForUpdate();
      }
    });

    return () => subscription.remove();
  }, []);
}
