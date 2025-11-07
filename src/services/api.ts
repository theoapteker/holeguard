import { supabase } from './supabase';
import type {
  ApiResponse,
  Game,
  CreateGameData,
  GameFilters,
  Profile,
  UpdateProfileData,
  PlayerFilters,
  GameStats,
  AddGameStatsData,
  PlayerStats,
  LeaderboardEntry,
  LeaderboardMetric,
  GameStatus,
} from '../types';

// ==================== GAME FUNCTIONS ====================

/**
 * Create a new game
 */
export async function createGame(gameData: CreateGameData): Promise<ApiResponse<Game>> {
  try {
    // Validate required fields
    if (!gameData.title || !gameData.location || !gameData.date || !gameData.time) {
      return {
        data: null,
        error: {
          message: 'Missing required fields: title, location, date, and time are required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Get current user to set as organizer
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: {
          message: 'You must be logged in to create a game',
          code: 'UNAUTHORIZED',
        },
      };
    }

    // Insert game
    const { data, error } = await supabase
      .from('games')
      .insert({
        ...gameData,
        organizer_id: user.id,
        current_players: 1,
        status: 'scheduled' as GameStatus,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Failed to create game',
          code: 'CREATE_FAILED',
        },
      };
    }

    // Auto-join the organizer to the game
    await supabase.from('game_participants').insert({
      game_id: data.id,
      player_id: user.id,
      status: 'confirmed',
    });

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating game:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred creating game',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Get games with optional filters
 */
export async function getGames(filters?: GameFilters): Promise<ApiResponse<Game[]>> {
  try {
    let query = supabase
      .from('games')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    // Apply filters
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.date) {
      query = query.eq('date', filters.date);
    }

    if (filters?.skill_level) {
      query = query.eq('skill_level', filters.skill_level);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      // By default, only show scheduled and in_progress games
      query = query.in('status', ['scheduled', 'in_progress']);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting games:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred getting games',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Get a specific game by ID
 */
export async function getGameById(gameId: string): Promise<ApiResponse<Game>> {
  try {
    if (!gameId) {
      return {
        data: null,
        error: {
          message: 'Game ID is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Game not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting game:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred getting game',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Join a game
 */
export async function joinGame(gameId: string, playerId: string): Promise<ApiResponse<null>> {
  try {
    if (!gameId || !playerId) {
      return {
        data: null,
        error: {
          message: 'Game ID and Player ID are required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Check if game exists and has space
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return {
        data: null,
        error: {
          message: 'Game not found',
          code: 'NOT_FOUND',
          details: gameError,
        },
      };
    }

    if (game.current_players >= game.max_players) {
      return {
        data: null,
        error: {
          message: 'Game is full',
          code: 'GAME_FULL',
        },
      };
    }

    if (game.status !== 'scheduled') {
      return {
        data: null,
        error: {
          message: 'Cannot join a game that is not scheduled',
          code: 'INVALID_STATUS',
        },
      };
    }

    // Check if player is already in the game
    const { data: existing } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .single();

    if (existing) {
      return {
        data: null,
        error: {
          message: 'Player is already in this game',
          code: 'ALREADY_JOINED',
        },
      };
    }

    // Add player to game
    const { error: joinError } = await supabase
      .from('game_participants')
      .insert({
        game_id: gameId,
        player_id: playerId,
        status: 'confirmed',
      });

    if (joinError) {
      return {
        data: null,
        error: {
          message: joinError.message,
          code: joinError.code,
          details: joinError,
        },
      };
    }

    // Update game's current player count
    const { error: updateError } = await supabase
      .from('games')
      .update({
        current_players: game.current_players + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (updateError) {
      // Try to rollback the participant insertion
      await supabase
        .from('game_participants')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', playerId);

      return {
        data: null,
        error: {
          message: 'Failed to update game',
          code: 'UPDATE_FAILED',
          details: updateError,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error joining game:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred joining game',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Leave a game
 */
export async function leaveGame(gameId: string, playerId: string): Promise<ApiResponse<null>> {
  try {
    if (!gameId || !playerId) {
      return {
        data: null,
        error: {
          message: 'Game ID and Player ID are required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return {
        data: null,
        error: {
          message: 'Game not found',
          code: 'NOT_FOUND',
          details: gameError,
        },
      };
    }

    // Check if player is the organizer
    if (game.organizer_id === playerId) {
      return {
        data: null,
        error: {
          message: 'Game organizer cannot leave the game. Cancel the game instead.',
          code: 'ORGANIZER_CANNOT_LEAVE',
        },
      };
    }

    // Check if player is in the game
    const { data: participant } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .single();

    if (!participant) {
      return {
        data: null,
        error: {
          message: 'Player is not in this game',
          code: 'NOT_IN_GAME',
        },
      };
    }

    // Remove player from game
    const { error: deleteError } = await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', gameId)
      .eq('player_id', playerId);

    if (deleteError) {
      return {
        data: null,
        error: {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError,
        },
      };
    }

    // Update game's current player count
    const { error: updateError } = await supabase
      .from('games')
      .update({
        current_players: Math.max(0, game.current_players - 1),
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('Failed to update game player count:', updateError);
      // Don't rollback since the main operation (removing participant) succeeded
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error leaving game:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred leaving game',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Update game status
 */
export async function updateGameStatus(gameId: string, status: GameStatus): Promise<ApiResponse<Game>> {
  try {
    if (!gameId || !status) {
      return {
        data: null,
        error: {
          message: 'Game ID and status are required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Validate status
    const validStatuses: GameStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        data: null,
        error: {
          message: 'Invalid status. Must be one of: scheduled, in_progress, completed, cancelled',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: {
          message: 'You must be logged in to update game status',
          code: 'UNAUTHORIZED',
        },
      };
    }

    // Check if user is the organizer
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return {
        data: null,
        error: {
          message: 'Game not found',
          code: 'NOT_FOUND',
          details: gameError,
        },
      };
    }

    if (game.organizer_id !== user.id) {
      return {
        data: null,
        error: {
          message: 'Only the game organizer can update the game status',
          code: 'FORBIDDEN',
        },
      };
    }

    // Update game status
    const { data, error } = await supabase
      .from('games')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Failed to update game status',
          code: 'UPDATE_FAILED',
        },
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating game status:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred updating game status',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

// ==================== PLAYER FUNCTIONS ====================

/**
 * Get a player's profile
 */
export async function getPlayerProfile(playerId: string): Promise<ApiResponse<Profile>> {
  try {
    if (!playerId) {
      return {
        data: null,
        error: {
          message: 'Player ID is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Player profile not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting player profile:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred getting player profile',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Update a player's profile
 */
export async function updatePlayerProfile(
  playerId: string,
  data: UpdateProfileData
): Promise<ApiResponse<Profile>> {
  try {
    if (!playerId) {
      return {
        data: null,
        error: {
          message: 'Player ID is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!data || Object.keys(data).length === 0) {
      return {
        data: null,
        error: {
          message: 'Profile data is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Get current user to verify authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || user.id !== playerId) {
      return {
        data: null,
        error: {
          message: 'You can only update your own profile',
          code: 'FORBIDDEN',
        },
      };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!profile) {
      return {
        data: null,
        error: {
          message: 'Failed to update profile',
          code: 'UPDATE_FAILED',
        },
      };
    }

    return {
      data: profile,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating player profile:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred updating player profile',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Search for players with optional filters
 */
export async function searchPlayers(query?: string, filters?: PlayerFilters): Promise<ApiResponse<Profile[]>> {
  try {
    let dbQuery = supabase
      .from('profiles')
      .select('*')
      .order('username', { ascending: true });

    // Apply text search if query is provided
    if (query && query.trim()) {
      dbQuery = dbQuery.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
    }

    // Apply filters
    if (filters?.skill_level) {
      dbQuery = dbQuery.eq('skill_level', filters.skill_level);
    }

    if (filters?.position) {
      dbQuery = dbQuery.eq('position', filters.position);
    }

    if (filters?.location) {
      dbQuery = dbQuery.ilike('location', `%${filters.location}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error searching players:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred searching players',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

// ==================== STATS FUNCTIONS ====================

/**
 * Add game statistics for a player
 */
export async function addGameStats(
  gameId: string,
  playerId: string,
  stats: AddGameStatsData
): Promise<ApiResponse<GameStats>> {
  try {
    if (!gameId || !playerId) {
      return {
        data: null,
        error: {
          message: 'Game ID and Player ID are required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!stats || Object.keys(stats).length === 0) {
      return {
        data: null,
        error: {
          message: 'Stats data is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return {
        data: null,
        error: {
          message: 'Game not found',
          code: 'NOT_FOUND',
          details: gameError,
        },
      };
    }

    // Check if player participated in the game
    const { data: participant } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .single();

    if (!participant) {
      return {
        data: null,
        error: {
          message: 'Player did not participate in this game',
          code: 'NOT_IN_GAME',
        },
      };
    }

    // Check if stats already exist for this game/player
    const { data: existingStats } = await supabase
      .from('game_stats')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .single();

    let result;

    if (existingStats) {
      // Update existing stats
      const { data, error } = await supabase
        .from('game_stats')
        .update(stats)
        .eq('id', existingStats.id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            code: error.code,
            details: error,
          },
        };
      }

      result = data;
    } else {
      // Insert new stats
      const { data, error } = await supabase
        .from('game_stats')
        .insert({
          game_id: gameId,
          player_id: playerId,
          goals: stats.goals || 0,
          assists: stats.assists || 0,
          blocks: stats.blocks || 0,
          steals: stats.steals || 0,
          turnovers: stats.turnovers || 0,
          fouls: stats.fouls || 0,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            code: error.code,
            details: error,
          },
        };
      }

      result = data;
    }

    if (!result) {
      return {
        data: null,
        error: {
          message: 'Failed to add game stats',
          code: 'INSERT_FAILED',
        },
      };
    }

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error adding game stats:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred adding game stats',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Get aggregated stats for a player
 */
export async function getPlayerStats(playerId: string): Promise<ApiResponse<PlayerStats>> {
  try {
    if (!playerId) {
      return {
        data: null,
        error: {
          message: 'Player ID is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Get all stats for the player
    const { data: stats, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('player_id', playerId);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!stats || stats.length === 0) {
      // Return empty stats if no games played
      return {
        data: {
          player_id: playerId,
          total_games: 0,
          total_goals: 0,
          total_assists: 0,
          total_blocks: 0,
          total_steals: 0,
          total_turnovers: 0,
          total_fouls: 0,
          avg_goals: 0,
          avg_assists: 0,
          avg_blocks: 0,
        },
        error: null,
      };
    }

    // Aggregate stats
    const totalGames = stats.length;
    const aggregated = stats.reduce(
      (acc, stat) => ({
        total_goals: acc.total_goals + (stat.goals || 0),
        total_assists: acc.total_assists + (stat.assists || 0),
        total_blocks: acc.total_blocks + (stat.blocks || 0),
        total_steals: acc.total_steals + (stat.steals || 0),
        total_turnovers: acc.total_turnovers + (stat.turnovers || 0),
        total_fouls: acc.total_fouls + (stat.fouls || 0),
      }),
      {
        total_goals: 0,
        total_assists: 0,
        total_blocks: 0,
        total_steals: 0,
        total_turnovers: 0,
        total_fouls: 0,
      }
    );

    const playerStats: PlayerStats = {
      player_id: playerId,
      total_games: totalGames,
      ...aggregated,
      avg_goals: aggregated.total_goals / totalGames,
      avg_assists: aggregated.total_assists / totalGames,
      avg_blocks: aggregated.total_blocks / totalGames,
    };

    return {
      data: playerStats,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting player stats:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred getting player stats',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Get leaderboard for a specific metric
 */
export async function getLeaderboard(
  metric: LeaderboardMetric,
  limit: number = 10
): Promise<ApiResponse<LeaderboardEntry[]>> {
  try {
    // Validate metric
    const validMetrics: LeaderboardMetric[] = ['goals', 'assists', 'blocks'];
    if (!validMetrics.includes(metric)) {
      return {
        data: null,
        error: {
          message: 'Invalid metric. Must be one of: goals, assists, blocks',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Get all game stats
    const { data: stats, error: statsError } = await supabase
      .from('game_stats')
      .select('player_id, goals, assists, blocks');

    if (statsError) {
      return {
        data: null,
        error: {
          message: statsError.message,
          code: statsError.code,
          details: statsError,
        },
      };
    }

    if (!stats || stats.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Aggregate stats by player
    const playerStatsMap = new Map<string, { total: number; games: number }>();

    stats.forEach((stat) => {
      const current = playerStatsMap.get(stat.player_id) || { total: 0, games: 0 };
      let value = 0;

      if (metric === 'goals') value = stat.goals || 0;
      else if (metric === 'assists') value = stat.assists || 0;
      else if (metric === 'blocks') value = stat.blocks || 0;

      playerStatsMap.set(stat.player_id, {
        total: current.total + value,
        games: current.games + 1,
      });
    });

    // Convert to array and sort
    const sortedPlayers = Array.from(playerStatsMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit);

    // Fetch player profiles
    const playerIds = sortedPlayers.map(([playerId]) => playerId);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', playerIds);

    if (profilesError) {
      return {
        data: null,
        error: {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError,
        },
      };
    }

    // Create profile map for easy lookup
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = sortedPlayers.map(([playerId, stats], index) => {
      const profile = profileMap.get(playerId);
      return {
        player_id: playerId,
        username: profile?.username || 'Unknown',
        full_name: profile?.full_name || 'Unknown',
        avatar_url: profile?.avatar_url,
        value: stats.total,
        rank: index + 1,
        total_games: stats.games,
      };
    });

    return {
      data: leaderboard,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting leaderboard:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred getting leaderboard',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}
