export type RootStackParamList = {
  Stats: undefined;
  Leaderboard: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
