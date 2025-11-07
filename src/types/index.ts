export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type GameStatus = 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  skill_level?: SkillLevel;
  created_at: string;
}

export interface Game {
  id: string;
  title: string;
  location: string;
  pool_name: string;
  date_time: string;
  skill_level: SkillLevel;
  max_players: number;
  current_players: number;
  host_id: string;
  host?: User;
  status: GameStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  joined_at: string;
}
