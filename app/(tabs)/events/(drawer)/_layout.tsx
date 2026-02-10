import { Drawer } from 'expo-router/drawer';
import { EventFilterProvider } from '../../../../src/context/EventFilterContext';
import { EventFilterDrawer } from '../../../../src/components/EventFilterDrawer';

export default function EventsDrawerLayout() {
  return (
    <EventFilterProvider>
      <Drawer
        screenOptions={{ headerShown: false, drawerPosition: 'right' }}
        drawerContent={(props) => <EventFilterDrawer {...props} />}
      >
        <Drawer.Screen name="index" />
      </Drawer>
    </EventFilterProvider>
  );
}
