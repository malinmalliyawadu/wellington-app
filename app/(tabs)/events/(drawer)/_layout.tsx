import { Drawer } from "expo-router/drawer";
import { EventFilterDrawer } from "../../../../src/components/EventFilterDrawer";

export default function EventsDrawerLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerPosition: "right" }}
      drawerContent={(props) => <EventFilterDrawer {...props} />}
    >
      <Drawer.Screen name="index" options={{ headerShown: false }} />
    </Drawer>
  );
}
