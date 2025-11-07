// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Game, 'id' | 'created_at'>>;
      };
      game_participants: {
        Row: GameParticipant;
        Insert: Omit<GameParticipant, 'id' | 'joined_at'>;
        Update: Partial<Omit<GameParticipant, 'id'>>;
      };
      game_stats: {
        Row: GameStats;
        Insert: Omit<GameStats, 'id' | 'created_at'>;
        Update: Partial<Omit<GameStats, 'id' | 'created_at'>>;
      };
    };
  };
}

// User Profile
export interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  skill_level?: SkillLevel;
  position?: Position;
  bio?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
}

// Game Types
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type Position = 'center' | 'wing' | 'driver' | 'point' | 'goalie' | 'any';

export interface Game {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  duration_minutes: number;
  skill_level: SkillLevel;
  max_players: number;
  current_players: number;
  status: GameStatus;
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

export interface GameParticipant {
  id: string;
  game_id: string;
  player_id: string;
  position?: Position;
  status: 'confirmed' | 'pending' | 'declined';
  joined_at: string;
}

// Stats Types
export interface GameStats {
  id: string;
  game_id: string;
  player_id: string;
  goals: number;
  assists: number;
  blocks: number;
  steals: number;
  turnovers: number;
  fouls: number;
  created_at: string;
}

export interface PlayerStats {
  player_id: string;
  total_games: number;
  total_goals: number;
  total_assists: number;
  total_blocks: number;
  total_steals: number;
  total_turnovers: number;
  total_fouls: number;
  avg_goals: number;
  avg_assists: number;
  avg_blocks: number;
}

export interface LeaderboardEntry {
  player_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  value: number;
  rank: number;
  total_games: number;
}

// API Request/Response Types
export interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  skill_level?: SkillLevel;
  position?: Position;
  bio?: string;
  location?: string;
}

export interface CreateGameData {
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  duration_minutes: number;
  skill_level: SkillLevel;
  max_players: number;
}

export interface GameFilters {
  location?: string;
  date?: string;
  skill_level?: SkillLevel;
  status?: GameStatus;
}

export interface PlayerFilters {
  skill_level?: SkillLevel;
  position?: Position;
  location?: string;
}

export interface AddGameStatsData {
  goals?: number;
  assists?: number;
  blocks?: number;
  steals?: number;
  turnovers?: number;
  fouls?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Leaderboard Metrics
export type LeaderboardMetric = 'goals' | 'assists' | 'blocks';
