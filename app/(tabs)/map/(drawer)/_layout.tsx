import { Drawer } from 'expo-router/drawer';
import { MapFilterProvider } from '../../../../src/context/MapFilterContext';
import { MapFilterDrawer } from '../../../../src/components/MapFilterDrawer';

export default function MapDrawerLayout() {
  return (
    <MapFilterProvider>
      <Drawer
        screenOptions={{ headerShown: false, drawerPosition: 'right' }}
        drawerContent={(props) => <MapFilterDrawer {...props} />}
      >
        <Drawer.Screen name="index" />
      </Drawer>
    </MapFilterProvider>
  );
}
