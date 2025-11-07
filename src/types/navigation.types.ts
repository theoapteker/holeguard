/**
 * Navigation type definitions for React Navigation
 *
 * Define all navigation stacks and their route parameters here
 */

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Main Stack
  Home: undefined;
  GameList: undefined;
  GameDetail: { gameId: string };
  GameCreate: undefined;
  GameEdit: { gameId: string };

  // Profile Stack
  Profile: undefined;
  PlayerProfile: { playerId: string };
  EditProfile: undefined;

  // Other
  Settings: undefined;
  Notifications: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  GamesTab: undefined;
  ProfileTab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
