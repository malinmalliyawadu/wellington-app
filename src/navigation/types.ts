import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Map: undefined;
  Feed: undefined;
  Events: undefined;
  Create: undefined;
  Profile: undefined;
};

export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;
