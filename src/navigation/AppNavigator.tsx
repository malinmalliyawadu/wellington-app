import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { colors } from '../theme/colors';

// Screens
import DiscoverScreen from '../screens/DiscoverScreen';
import FoodScreen from '../screens/FoodScreen';
import EventsScreen from '../screens/EventsScreen';
import TransportScreen from '../screens/TransportScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          headerShown: false,
          tabBarStyle: {
            borderTopColor: colors.border,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
        }}
      >
        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarLabel: 'Discover',
            tabBarIcon: ({ color }) => <TabIcon icon="🏙️" color={color} />,
          }}
        />
        <Tab.Screen
          name="Food"
          component={FoodScreen}
          options={{
            tabBarLabel: 'Food',
            tabBarIcon: ({ color }) => <TabIcon icon="☕" color={color} />,
          }}
        />
        <Tab.Screen
          name="Events"
          component={EventsScreen}
          options={{
            tabBarLabel: 'Events',
            tabBarIcon: ({ color }) => <TabIcon icon="🎉" color={color} />,
          }}
        />
        <Tab.Screen
          name="Transport"
          component={TransportScreen}
          options={{
            tabBarLabel: 'Transport',
            tabBarIcon: ({ color }) => <TabIcon icon="🚌" color={color} />,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{
            tabBarLabel: 'More',
            tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Simple emoji-based icon component
function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <text style={{ fontSize: 24, opacity: color === colors.primary ? 1 : 0.5 }}>
      {icon}
    </text>
  );
}
