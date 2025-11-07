import { PlayerStats, Game, Profile } from './database.types';

export interface PlayerStatsSummary {
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  totalBlocks: number;
  totalSteals: number;
  averageGoals: number;
  averageAssists: number;
  averageBlocks: number;
}

export interface GameWithStats extends Game {
  stats: PlayerStats;
}

export interface PositionStats {
  position: string;
  gamesPlayed: number;
}

export interface GoalsOverTime {
  date: string;
  goals: number;
  gameDate: Date;
}

export interface LeaderboardEntry {
  player: Profile;
  value: number;
  rank: number;
}

export type LeaderboardCategory = 'goals' | 'assists' | 'blocks' | 'games';
