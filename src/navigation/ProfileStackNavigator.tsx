import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '../screens/ProfileScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { FollowListScreen } from '../screens/FollowListScreen';
import { DiscoverUsersScreen } from '../screens/DiscoverUsersScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="DiscoverUsers"
        component={DiscoverUsersScreen}
        options={{ headerShown: true, headerTitle: 'Discover People', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}
