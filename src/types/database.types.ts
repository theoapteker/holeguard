/**
 * WaterPolo Connect - Database Types
 *
 * This file contains TypeScript types that match the Supabase database schema.
 * Auto-generated types can be created using: npx supabase gen types typescript
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PositionType = 'goalie' | 'driver' | 'wing' | 'center';

export type SkillLevelType = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export type GameStatusType = 'open' | 'full' | 'completed' | 'cancelled';

export type ParticipantStatusType = 'pending' | 'confirmed' | 'declined';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Profile {
  id: string; // UUID referencing auth.users
  username: string;
  full_name: string;
  position: PositionType | null;
  skill_level: SkillLevelType | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface Game {
  id: string; // UUID
  created_by: string; // UUID referencing profiles
  title: string;
  description: string | null;
  location: string;
  pool_address: string;
  latitude: number | null; // Decimal(10, 8)
  longitude: number | null; // Decimal(11, 8)
  date_time: string; // ISO 8601 timestamp
  max_players: number;
  skill_level_required: SkillLevelType | null;
  status: GameStatusType;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface GameParticipant {
  id: string; // UUID
  game_id: string; // UUID referencing games
  player_id: string; // UUID referencing profiles
  status: ParticipantStatusType;
  created_at: string; // ISO 8601 timestamp
}

export interface PlayerStats {
  id: string; // UUID
  player_id: string; // UUID referencing profiles
  game_id: string; // UUID referencing games
  goals: number;
  assists: number;
  blocks: number;
  steals: number;
  created_at: string; // ISO 8601 timestamp
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type GameInsert = Omit<Game, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  id?: string;
  status?: GameStatusType;
  created_at?: string;
  updated_at?: string;
};

export type GameParticipantInsert = Omit<GameParticipant, 'id' | 'created_at' | 'status'> & {
  id?: string;
  status?: ParticipantStatusType;
  created_at?: string;
};

export type PlayerStatsInsert = Omit<PlayerStats, 'id' | 'created_at' | 'goals' | 'assists' | 'blocks' | 'steals'> & {
  id?: string;
  goals?: number;
  assists?: number;
  blocks?: number;
  steals?: number;
  created_at?: string;
};

// ============================================================================
// UPDATE TYPES (for updating existing records)
// ============================================================================

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

export type GameUpdate = Partial<Omit<Game, 'id' | 'created_by' | 'created_at'>>;

export type GameParticipantUpdate = Partial<Omit<GameParticipant, 'id' | 'game_id' | 'player_id' | 'created_at'>>;

export type PlayerStatsUpdate = Partial<Omit<PlayerStats, 'id' | 'player_id' | 'game_id' | 'created_at'>>;

// ============================================================================
// QUERY RESULT TYPES (with joins)
// ============================================================================

export interface GameWithCreator extends Game {
  creator: Profile;
}

export interface GameWithParticipants extends Game {
  participants: (GameParticipant & { player: Profile })[];
  confirmed_count: number;
}

export interface GameParticipantWithDetails extends GameParticipant {
  game: Game;
  player: Profile;
}

export interface PlayerStatsWithDetails extends PlayerStats {
  player: Profile;
  game: Game;
}

export interface ProfileWithStats extends Profile {
  total_games: number;
  total_goals: number;
  total_assists: number;
  total_blocks: number;
  total_steals: number;
  average_goals: number;
  average_assists: number;
}

// ============================================================================
// DATABASE TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      games: {
        Row: Game;
        Insert: GameInsert;
        Update: GameUpdate;
      };
      game_participants: {
        Row: GameParticipant;
        Insert: GameParticipantInsert;
        Update: GameParticipantUpdate;
      };
      player_stats: {
        Row: PlayerStats;
        Insert: PlayerStatsInsert;
        Update: PlayerStatsUpdate;
      };
    };
    Enums: {
      position_type: PositionType;
      skill_level_type: SkillLevelType;
      game_status_type: GameStatusType;
      participant_status_type: ParticipantStatusType;
    };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
