-- WaterPolo Connect - Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE position_type AS ENUM ('goalie', 'driver', 'wing', 'center');
CREATE TYPE skill_level_type AS ENUM ('beginner', 'intermediate', 'advanced', 'pro');
CREATE TYPE game_status_type AS ENUM ('open', 'full', 'completed', 'cancelled');
CREATE TYPE participant_status_type AS ENUM ('pending', 'confirmed', 'declined');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    position position_type,
    skill_level skill_level_type,
    location TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_skill_level ON profiles(skill_level);
CREATE INDEX idx_profiles_position ON profiles(position);

-- ============================================================================
-- GAMES TABLE
-- ============================================================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    pool_address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    date_time TIMESTAMPTZ NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 14,
    skill_level_required skill_level_type,
    status game_status_type NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT max_players_check CHECK (max_players > 0 AND max_players <= 30),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL AND
         latitude BETWEEN -90 AND 90 AND
         longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT future_date CHECK (date_time > created_at)
);

-- Create indexes for efficient queries
CREATE INDEX idx_games_created_by ON games(created_by);
CREATE INDEX idx_games_date_time ON games(date_time);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_skill_level ON games(skill_level_required);
CREATE INDEX idx_games_location ON games USING GIN(to_tsvector('english', location));

-- Spatial index for location-based queries
CREATE INDEX idx_games_coordinates ON games(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- GAME_PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status participant_status_type NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a player can only join a game once
    CONSTRAINT unique_game_participant UNIQUE(game_id, player_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX idx_game_participants_player_id ON game_participants(player_id);
CREATE INDEX idx_game_participants_status ON game_participants(status);

-- ============================================================================
-- PLAYER_STATS TABLE
-- ============================================================================
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    blocks INTEGER NOT NULL DEFAULT 0,
    steals INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure stats are non-negative
    CONSTRAINT goals_non_negative CHECK (goals >= 0),
    CONSTRAINT assists_non_negative CHECK (assists >= 0),
    CONSTRAINT blocks_non_negative CHECK (blocks >= 0),
    CONSTRAINT steals_non_negative CHECK (steals >= 0),

    -- Ensure one stat record per player per game
    CONSTRAINT unique_player_game_stats UNIQUE(player_id, game_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_player_stats_game_id ON player_stats(game_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check if game is full and update status
CREATE OR REPLACE FUNCTION check_game_capacity()
RETURNS TRIGGER AS $$
DECLARE
    confirmed_count INTEGER;
    game_max_players INTEGER;
BEGIN
    -- Get the count of confirmed participants and max players for the game
    SELECT COUNT(*), g.max_players
    INTO confirmed_count, game_max_players
    FROM game_participants gp
    JOIN games g ON g.id = gp.game_id
    WHERE gp.game_id = NEW.game_id
    AND gp.status = 'confirmed'
    GROUP BY g.max_players;

    -- If count equals max_players, update game status to 'full'
    IF confirmed_count >= game_max_players THEN
        UPDATE games SET status = 'full' WHERE id = NEW.game_id;
    ELSIF confirmed_count < game_max_players THEN
        UPDATE games SET status = 'open' WHERE id = NEW.game_id AND status = 'full';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check game capacity when participants change
CREATE TRIGGER check_game_capacity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON game_participants
    FOR EACH ROW
    EXECUTE FUNCTION check_game_capacity();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- ============================================================================
-- GAMES POLICIES
-- ============================================================================

-- Anyone can view open or full games
CREATE POLICY "Games are viewable by everyone"
    ON games FOR SELECT
    USING (true);

-- Authenticated users can create games
CREATE POLICY "Authenticated users can create games"
    ON games FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Game creators can update their games
CREATE POLICY "Game creators can update their games"
    ON games FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Game creators can delete their games
CREATE POLICY "Game creators can delete their games"
    ON games FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================================================
-- GAME_PARTICIPANTS POLICIES
-- ============================================================================

-- Anyone can view game participants
CREATE POLICY "Game participants are viewable by everyone"
    ON game_participants FOR SELECT
    USING (true);

-- Users can join games (insert their own participation)
CREATE POLICY "Users can join games"
    ON game_participants FOR INSERT
    WITH CHECK (auth.uid() = player_id);

-- Users can update their own participation status
CREATE POLICY "Users can update their own participation"
    ON game_participants FOR UPDATE
    USING (auth.uid() = player_id)
    WITH CHECK (auth.uid() = player_id);

-- Game creators can update participant status
CREATE POLICY "Game creators can update participant status"
    ON game_participants FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT created_by FROM games WHERE id = game_id
        )
    );

-- Users can remove themselves from games
CREATE POLICY "Users can remove themselves from games"
    ON game_participants FOR DELETE
    USING (auth.uid() = player_id);

-- Game creators can remove participants
CREATE POLICY "Game creators can remove participants"
    ON game_participants FOR DELETE
    USING (
        auth.uid() IN (
            SELECT created_by FROM games WHERE id = game_id
        )
    );

-- ============================================================================
-- PLAYER_STATS POLICIES
-- ============================================================================

-- Anyone can view player stats
CREATE POLICY "Player stats are viewable by everyone"
    ON player_stats FOR SELECT
    USING (true);

-- Game creators can insert stats for participants
CREATE POLICY "Game creators can insert player stats"
    ON player_stats FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT created_by FROM games WHERE id = game_id
        )
    );

-- Game creators can update stats
CREATE POLICY "Game creators can update player stats"
    ON player_stats FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT created_by FROM games WHERE id = game_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT created_by FROM games WHERE id = game_id
        )
    );

-- Game creators can delete stats
CREATE POLICY "Game creators can delete player stats"
    ON player_stats FOR DELETE
    USING (
        auth.uid() IN (
            SELECT created_by FROM games WHERE id = game_id
        )
    );

-- Players can update their own stats
CREATE POLICY "Players can update their own stats"
    ON player_stats FOR UPDATE
    USING (auth.uid() = player_id)
    WITH CHECK (auth.uid() = player_id);
