import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';

export type MapStackParamList = {
  MapHome: undefined;
  PlaceDetail: { placeId: string };
};

export type FeedStackParamList = {
  FeedHome: undefined;
  UserProfile: { userId: string };
  FollowList: { userId: string; tab: 'followers' | 'following' };
  DiscoverUsers: undefined;
  PlaceDetail: { placeId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  UserProfile: { userId: string };
  FollowList: { userId: string; tab: 'followers' | 'following' };
  DiscoverUsers: undefined;
  PlaceDetail: { placeId: string };
};

export type RootTabParamList = {
  Map: NavigatorScreenParams<MapStackParamList>;
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Events: undefined;
  Create: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;

export type MapStackScreenProps<T extends keyof MapStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MapStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
  >;

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
