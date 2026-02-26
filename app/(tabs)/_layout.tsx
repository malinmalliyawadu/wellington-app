import {
  NativeTabs,
  Icon,
  Label,
  Badge,
} from "expo-router/unstable-native-tabs";
import { useNotifications } from "../../src/context/NotificationContext";
import { useTheme } from "../../src/theme/ThemeContext";

function TabLayout() {
  const { unreadCount } = useNotifications();
  const { colors } = useTheme();
  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feed">
        <Icon sf={{ default: "newspaper", selected: "newspaper.fill" }} />
        <Label>Feed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <Icon sf={{ default: "calendar", selected: "calendar" }} />
        <Label>Events</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
        />
        <Label>Profile</Label>
        {unreadCount > 0 && (
          <Badge>{unreadCount > 99 ? "99+" : String(unreadCount)}</Badge>
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default TabLayout;
