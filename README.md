# WaterPolo Connect - Supabase Services

This project contains the Supabase client and API services for the WaterPolo Connect application.

## Features

### Authentication Service (`/src/services/supabase.ts`)

- **signUp**: Create new user accounts with email, password, username, and full name
- **signIn**: Authenticate users with email and password
- **signOut**: Sign out the current user
- **getCurrentUser**: Get the currently authenticated user
- **updateProfile**: Update user profile information
- **onAuthStateChange**: Listen to authentication state changes

### API Service (`/src/services/api.ts`)

#### Game Management
- **createGame**: Create a new water polo game
- **getGames**: Retrieve games with optional filters (location, date, skill level, status)
- **getGameById**: Get a specific game by ID
- **joinGame**: Join a game as a player
- **leaveGame**: Leave a game
- **updateGameStatus**: Update game status (scheduled, in_progress, completed, cancelled)

#### Player Management
- **getPlayerProfile**: Get a player's profile information
- **updatePlayerProfile**: Update player profile data
- **searchPlayers**: Search for players with optional filters

#### Statistics
- **addGameStats**: Add or update game statistics for a player
- **getPlayerStats**: Get aggregated statistics for a player
- **getLeaderboard**: Get leaderboard rankings for goals, assists, or blocks

## Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

For TypeScript projects, types are included in the package.

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Get your Supabase URL and anon key from your [Supabase project settings](https://app.supabase.com/project/_/settings/api).

### 3. Database Schema

You'll need to create the following tables in your Supabase database:

#### profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
  position TEXT CHECK (position IN ('center', 'wing', 'driver', 'point', 'goalie', 'any')),
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### games
```sql
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 1,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  organizer_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### game_participants
```sql
CREATE TABLE game_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  position TEXT CHECK (position IN ('center', 'wing', 'driver', 'point', 'goalie', 'any')),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'declined')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);
```

#### game_stats
```sql
CREATE TABLE game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);
```

### 4. Set Up Row Level Security (RLS)

Enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Games policies
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their games"
  ON games FOR UPDATE USING (auth.uid() = organizer_id);

-- Game participants policies
CREATE POLICY "Participants are viewable by everyone"
  ON game_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join games"
  ON game_participants FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can leave games"
  ON game_participants FOR DELETE USING (auth.uid() = player_id);

-- Game stats policies
CREATE POLICY "Stats are viewable by everyone"
  ON game_stats FOR SELECT USING (true);

CREATE POLICY "Players can add their own stats"
  ON game_stats FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own stats"
  ON game_stats FOR UPDATE USING (auth.uid() = player_id);
```

## Usage Examples

### Authentication

```typescript
import { signUp, signIn, signOut, getCurrentUser } from './src/services/supabase';

// Sign up a new user
const result = await signUp(
  'user@example.com',
  'securepassword',
  'johndoe',
  'John Doe'
);

if (result.error) {
  console.error('Sign up failed:', result.error.message);
} else {
  console.log('User created:', result.data);
}

// Sign in
const signInResult = await signIn('user@example.com', 'securepassword');

// Get current user
const userResult = await getCurrentUser();
```

### Games

```typescript
import { createGame, getGames, joinGame } from './src/services/api';

// Create a game
const game = await createGame({
  title: 'Weekend Water Polo Match',
  description: 'Friendly game for intermediate players',
  location: 'City Pool',
  date: '2025-11-15',
  time: '14:00',
  duration_minutes: 90,
  skill_level: 'intermediate',
  max_players: 14,
});

// Get games with filters
const games = await getGames({
  location: 'City Pool',
  skill_level: 'intermediate',
  status: 'scheduled',
});

// Join a game
await joinGame(gameId, playerId);
```

### Statistics

```typescript
import { addGameStats, getPlayerStats, getLeaderboard } from './src/services/api';

// Add game stats
await addGameStats(gameId, playerId, {
  goals: 5,
  assists: 3,
  blocks: 2,
  steals: 4,
});

// Get player stats
const stats = await getPlayerStats(playerId);
console.log(`Total goals: ${stats.data?.total_goals}`);

// Get leaderboard
const leaderboard = await getLeaderboard('goals', 10);
```

## TypeScript Types

All types are defined in `/src/types/index.ts` and include:

- `Profile`: User profile data
- `Game`: Game information
- `GameStats`: Game statistics
- `PlayerStats`: Aggregated player statistics
- `LeaderboardEntry`: Leaderboard ranking data
- And more...

## Error Handling

All API functions return an `ApiResponse<T>` object with the following structure:

```typescript
{
  data: T | null,
  error: {
    message: string,
    code?: string,
    details?: unknown
  } | null
}
```

Always check for errors before using the data:

```typescript
const result = await getGames();
if (result.error) {
  console.error('Error:', result.error.message);
} else {
  console.log('Games:', result.data);
}
```

## License

MIT
