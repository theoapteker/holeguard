export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Pool {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  amenities?: string[];
  image_url?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  pool_id: string;
  pool?: Pool;
  start_time: string;
  end_time: string;
  max_participants?: number;
  current_participants: number;
  created_by: string;
  event_type: 'training' | 'match' | 'tournament' | 'social';
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  member_count: number;
}

export interface Post {
  id: string;
  user_id: string;
  user?: User;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}
