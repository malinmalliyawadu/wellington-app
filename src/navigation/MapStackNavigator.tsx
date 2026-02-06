import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapStackParamList } from './types';
import { MapScreen } from '../screens/MapScreen';
import { PlaceDetailScreen } from '../screens/PlaceDetailScreen';

const Stack = createNativeStackNavigator<MapStackParamList>();

export function MapStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapHome" component={MapScreen} />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Map' }}
      />
    </Stack.Navigator>
  );
}
