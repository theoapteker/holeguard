import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Auth Navigator Params
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

// Main Navigator Params
export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  AddGame: undefined;
  Stats: undefined;
  Profile: undefined;
};

// Root Navigator Params
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Loading: undefined;
};

// Navigation Props for Auth Screens
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

// Navigation Props for Main Screens
export type MainNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Declare global navigation types for type-safe navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
