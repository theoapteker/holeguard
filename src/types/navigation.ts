import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  EventDetails: { eventId: string };
  PoolDetails: { poolId: string };
  Profile: { userId: string };
  CreateEvent: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Events: undefined;
  Community: undefined;
  Settings: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export type EventDetailsRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;
export type PoolDetailsRouteProp = RouteProp<RootStackParamList, 'PoolDetails'>;
export type ProfileRouteProp = RouteProp<RootStackParamList, 'Profile'>;
