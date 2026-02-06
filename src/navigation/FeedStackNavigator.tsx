import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedStackParamList } from './types';
import { FeedScreen } from '../screens/FeedScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { FollowListScreen } from '../screens/FollowListScreen';
import { DiscoverUsersScreen } from '../screens/DiscoverUsersScreen';
import { PlaceDetailScreen } from '../screens/PlaceDetailScreen';

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedHome" component={FeedScreen} />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Feed' }}
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
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Feed' }}
      />
    </Stack.Navigator>
  );
}
