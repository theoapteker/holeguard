# WaterPolo Connect - Database Schema

This repository contains the Supabase database schema for the WaterPolo Connect application.

## Overview

WaterPolo Connect is a platform that helps water polo players find and organize pickup games in their area. The database schema supports user profiles, game creation, participant management, and player statistics tracking.

## Database Schema

### Tables

#### 1. **profiles**
Stores user profile information linked to Supabase auth.

- `id` (UUID) - Primary key, references auth.users
- `username` (TEXT) - Unique username, 3-30 characters, alphanumeric + underscore
- `full_name` (TEXT) - User's full name
- `position` (ENUM) - Player position: goalie, driver, wing, center
- `skill_level` (ENUM) - Skill level: beginner, intermediate, advanced, pro
- `location` (TEXT) - User's location
- `bio` (TEXT) - User biography
- `avatar_url` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMPTZ) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes:**
- `idx_profiles_username` - Fast username lookups
- `idx_profiles_skill_level` - Filter by skill level
- `idx_profiles_position` - Filter by position

---

#### 2. **games**
Stores information about water polo games.

- `id` (UUID) - Primary key
- `created_by` (UUID) - References profiles(id)
- `title` (TEXT) - Game title
- `description` (TEXT) - Game description
- `location` (TEXT) - Location name
- `pool_address` (TEXT) - Physical address of the pool
- `latitude` (DECIMAL) - GPS latitude (-90 to 90)
- `longitude` (DECIMAL) - GPS longitude (-180 to 180)
- `date_time` (TIMESTAMPTZ) - When the game is scheduled
- `max_players` (INTEGER) - Maximum number of players (1-30, default 14)
- `skill_level_required` (ENUM) - Minimum skill level
- `status` (ENUM) - Game status: open, full, completed, cancelled
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes:**
- `idx_games_created_by` - Games by creator
- `idx_games_date_time` - Sort/filter by date
- `idx_games_status` - Filter by status
- `idx_games_skill_level` - Filter by skill level
- `idx_games_location` - Full-text search on location
- `idx_games_coordinates` - Spatial queries for nearby games

**Constraints:**
- `max_players_check` - Max players must be between 1-30
- `valid_coordinates` - Validates GPS coordinates
- `future_date` - Game date must be in the future

---

#### 3. **game_participants**
Tracks which players have joined which games.

- `id` (UUID) - Primary key
- `game_id` (UUID) - References games(id)
- `player_id` (UUID) - References profiles(id)
- `status` (ENUM) - Participation status: pending, confirmed, declined
- `created_at` (TIMESTAMPTZ) - Join timestamp

**Indexes:**
- `idx_game_participants_game_id` - Participants for a game
- `idx_game_participants_player_id` - Games for a player
- `idx_game_participants_status` - Filter by status

**Constraints:**
- `unique_game_participant` - A player can only join a game once

---

#### 4. **player_stats**
Records player performance statistics for each game.

- `id` (UUID) - Primary key
- `player_id` (UUID) - References profiles(id)
- `game_id` (UUID) - References games(id)
- `goals` (INTEGER) - Number of goals scored (default 0)
- `assists` (INTEGER) - Number of assists (default 0)
- `blocks` (INTEGER) - Number of blocks (default 0)
- `steals` (INTEGER) - Number of steals (default 0)
- `created_at` (TIMESTAMPTZ) - Stats creation timestamp

**Indexes:**
- `idx_player_stats_player_id` - Stats for a player
- `idx_player_stats_game_id` - Stats for a game

**Constraints:**
- All stats must be non-negative
- `unique_player_game_stats` - One stat record per player per game

---

## Enums

```sql
position_type: 'goalie' | 'driver' | 'wing' | 'center'
skill_level_type: 'beginner' | 'intermediate' | 'advanced' | 'pro'
game_status_type: 'open' | 'full' | 'completed' | 'cancelled'
participant_status_type: 'pending' | 'confirmed' | 'declined'
```

## Database Functions

### `update_updated_at_column()`
Automatically updates the `updated_at` timestamp when a record is modified.

### `check_game_capacity()`
Automatically updates game status to 'full' when the number of confirmed participants reaches `max_players`, and back to 'open' when participants leave.

## Row Level Security (RLS) Policies

### Profiles
- ✅ **SELECT**: Anyone can view profiles
- ✅ **INSERT**: Users can create their own profile
- ✅ **UPDATE**: Users can update their own profile
- ✅ **DELETE**: Users can delete their own profile

### Games
- ✅ **SELECT**: Anyone can view games
- ✅ **INSERT**: Authenticated users can create games
- ✅ **UPDATE**: Game creators can update their games
- ✅ **DELETE**: Game creators can delete their games

### Game Participants
- ✅ **SELECT**: Anyone can view participants
- ✅ **INSERT**: Users can join games
- ✅ **UPDATE**: Users can update their own participation; Game creators can update any participant
- ✅ **DELETE**: Users can remove themselves; Game creators can remove any participant

### Player Stats
- ✅ **SELECT**: Anyone can view stats
- ✅ **INSERT**: Game creators can insert stats for participants
- ✅ **UPDATE**: Game creators can update stats; Players can update their own stats
- ✅ **DELETE**: Game creators can delete stats

## Setup Instructions

### 1. Initialize Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Or initialize a new local project
supabase init
```

### 2. Run Migrations

```bash
# Apply migrations to your Supabase project
supabase db push

# Or run migrations locally
supabase db reset
```

### 3. Generate TypeScript Types (Optional)

The types are already included in `src/types/database.types.ts`, but you can regenerate them:

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

## Usage Examples

### TypeScript/JavaScript with Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Create a profile
const { data: profile, error } = await supabase
  .from('profiles')
  .insert({
    id: userId,
    username: 'waterpolopro',
    full_name: 'John Doe',
    position: 'driver',
    skill_level: 'advanced',
  })
  .select()
  .single();

// Create a game
const { data: game, error } = await supabase
  .from('games')
  .insert({
    created_by: userId,
    title: 'Pickup Game at Community Pool',
    location: 'Downtown Community Center',
    pool_address: '123 Main St, City, State',
    latitude: 37.7749,
    longitude: -122.4194,
    date_time: '2025-11-15T18:00:00Z',
    max_players: 14,
    skill_level_required: 'intermediate',
  })
  .select()
  .single();

// Join a game
const { data: participant, error } = await supabase
  .from('game_participants')
  .insert({
    game_id: gameId,
    player_id: userId,
    status: 'confirmed',
  })
  .select()
  .single();

// Get games with participants
const { data: games, error } = await supabase
  .from('games')
  .select(`
    *,
    creator:profiles!games_created_by_fkey(*),
    participants:game_participants(
      *,
      player:profiles(*)
    )
  `)
  .eq('status', 'open')
  .gte('date_time', new Date().toISOString())
  .order('date_time', { ascending: true });

// Record player stats
const { data: stats, error } = await supabase
  .from('player_stats')
  .insert({
    player_id: playerId,
    game_id: gameId,
    goals: 5,
    assists: 3,
    blocks: 2,
    steals: 1,
  })
  .select()
  .single();
```

## Features

- ✅ User profiles with positions and skill levels
- ✅ Game creation and management
- ✅ Player participation tracking
- ✅ Automatic game capacity management
- ✅ Player statistics tracking
- ✅ Location-based game search (with GPS coordinates)
- ✅ Full-text search on locations
- ✅ Row Level Security for data protection
- ✅ Automatic timestamp management
- ✅ Comprehensive TypeScript types

## File Structure

```
holeguard/
├── supabase/
│   └── migrations/
│       └── 20250107000000_initial_schema.sql
├── src/
│   └── types/
│       └── database.types.ts
└── README.md
```

## Future Enhancements

Potential improvements for the schema:

1. **Teams Table** - Support for organized teams
2. **Messages/Chat** - In-game communication
3. **Reviews/Ratings** - Player feedback system
4. **Recurring Games** - Support for regular weekly games
5. **Photos** - Game photo galleries
6. **Notifications** - Game reminders and updates
7. **Friends/Connections** - Social network features

## License

MIT

## Support

For issues or questions, please open an issue in this repository.
