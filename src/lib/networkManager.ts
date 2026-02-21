import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

export function setupNetworkManager() {
  onlineManager.setEventListener((setOnline) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
    return unsubscribe;
  });
}
