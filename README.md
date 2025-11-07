# HoleGuard

A React Native app for organizing and joining water polo games.

## Features

- Browse nearby/upcoming water polo games
- Real-time updates when new games are created
- Join games with player count tracking
- Filter games by skill level and location
- Pull-to-refresh for latest updates
- Beautiful card-based UI with shadows and badges

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy `.env.example` to `.env`
3. Add your Supabase URL and anon key to `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Database

Run the following SQL in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  pool_name TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  max_players INTEGER NOT NULL DEFAULT 10,
  current_players INTEGER NOT NULL DEFAULT 1,
  host_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_players table (junction table)
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Games are viewable by everyone" ON games FOR SELECT USING (true);
CREATE POLICY "Game players are viewable by everyone" ON game_players FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

### 4. Run the App

```bash
npm start
```

Then choose your platform (iOS, Android, or Web).

## Project Structure

```
holeguard/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── GameCard.tsx
│   │   ├── SkillBadge.tsx
│   │   └── StatusBadge.tsx
│   ├── config/            # Configuration files
│   │   └── supabase.ts
│   ├── screens/           # Screen components
│   │   └── HomeScreen.tsx
│   ├── services/          # API services
│   │   └── gameService.ts
│   └── types/             # TypeScript types
│       └── index.ts
├── App.tsx
├── package.json
└── tsconfig.json
```

## Key Components

### HomeScreen

The main screen showing a feed of available games with:
- Header with app name and notification icon
- Pull-to-refresh functionality
- Real-time updates via Supabase subscriptions
- Empty state when no games are available
- Join game functionality

### GameCard

Displays game information including:
- Game title and status badge
- Location and pool name
- Date and time (formatted)
- Skill level badge
- Player count
- Host information with avatar
- Join/Full button

## Technologies

- React Native
- TypeScript
- Expo
- Supabase (Database & Real-time)
- React Navigation
- date-fns (Date formatting)

## Next Steps

- [ ] Add authentication
- [ ] Implement create game screen
- [ ] Add game filters
- [ ] Add notifications
- [ ] Add user profile screen
- [ ] Add game details screen
- [ ] Implement location-based filtering
