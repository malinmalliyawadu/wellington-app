import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';

export type FeedStackParamList = {
  FeedHome: undefined;
  UserProfile: { userId: string };
  FollowList: { userId: string; tab: 'followers' | 'following' };
  DiscoverUsers: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  UserProfile: { userId: string };
  FollowList: { userId: string; tab: 'followers' | 'following' };
  DiscoverUsers: undefined;
};

export type RootTabParamList = {
  Map: undefined;
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Events: undefined;
  Create: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;

export type FeedStackScreenProps<T extends keyof FeedStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<FeedStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
  >;
