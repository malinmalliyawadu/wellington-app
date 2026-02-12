import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feed">
        <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
        <Label>Feed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <Label>Events</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
