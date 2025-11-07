import { supabase, handleSupabaseError } from './supabase';
import type {
  GameWithCreator,
  ProfileWithStats,
  SkillLevelType,
  PositionType,
  GameStatusType,
} from '../types/database.types';

// ============================================================================
// GAMES SEARCH
// ============================================================================

interface SearchGamesParams {
  query?: string;
  status?: GameStatusType[];
  skillLevels?: SkillLevelType[];
  dateRange?: 'all' | 'today' | 'week' | 'month';
  userLocation?: { latitude: number; longitude: number } | null;
  radius?: number; // in kilometers
}

/**
 * Search for games with various filters
 */
export const searchGames = async (
  params: SearchGamesParams
): Promise<GameWithCreator[]> => {
  try {
    let query = supabase
      .from('games')
      .select(`
        *,
        creator:profiles!games_created_by_fkey(*),
        participants:game_participants(
          *,
          player:profiles(*)
        )
      `);

    // Filter by status
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    // Filter by skill level
    if (params.skillLevels && params.skillLevels.length > 0) {
      query = query.in('skill_level_required', params.skillLevels);
    }

    // Filter by date range
    const now = new Date();
    if (params.dateRange === 'today') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      query = query
        .gte('date_time', now.toISOString())
        .lte('date_time', endOfDay.toISOString());
    } else if (params.dateRange === 'week') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      query = query
        .gte('date_time', now.toISOString())
        .lte('date_time', endOfWeek.toISOString());
    } else if (params.dateRange === 'month') {
      const endOfMonth = new Date(now);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      query = query
        .gte('date_time', now.toISOString())
        .lte('date_time', endOfMonth.toISOString());
    } else {
      // Default: show only future games
      query = query.gte('date_time', now.toISOString());
    }

    // Text search on location or title
    if (params.query && params.query.trim().length > 0) {
      // Using OR condition for title and location search
      query = query.or(
        `title.ilike.%${params.query}%,location.ilike.%${params.query}%,pool_address.ilike.%${params.query}%`
      );
    }

    // Order by date
    query = query.order('date_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'searchGames');
      return [];
    }

    // Calculate distance if user location is provided
    let results = data as GameWithCreator[];

    if (params.userLocation && params.radius) {
      results = results
        .map((game) => {
          if (game.latitude && game.longitude) {
            const distance = calculateDistance(
              params.userLocation!.latitude,
              params.userLocation!.longitude,
              game.latitude,
              game.longitude
            );
            return { ...game, distance };
          }
          return game;
        })
        .filter((game) => !game.distance || game.distance <= params.radius!)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Calculate confirmed participant count for each game
    results = results.map((game) => {
      const confirmedCount = game.participants
        ? game.participants.filter((p) => p.status === 'confirmed').length
        : 0;
      return { ...game, confirmed_count: confirmedCount };
    });

    return results;
  } catch (error) {
    console.error('Error in searchGames:', error);
    return [];
  }
};

// ============================================================================
// PLAYERS SEARCH
// ============================================================================

interface SearchPlayersParams {
  query?: string;
  positions?: PositionType[];
  skillLevels?: SkillLevelType[];
  userLocation?: { latitude: number; longitude: number } | null;
  radius?: number; // in kilometers
}

/**
 * Search for players with various filters
 */
export const searchPlayers = async (
  params: SearchPlayersParams
): Promise<ProfileWithStats[]> => {
  try {
    let query = supabase.from('profiles').select(`
      *,
      stats:player_stats(
        goals,
        assists,
        blocks,
        steals
      )
    `);

    // Filter by position
    if (params.positions && params.positions.length > 0) {
      query = query.in('position', params.positions);
    }

    // Filter by skill level
    if (params.skillLevels && params.skillLevels.length > 0) {
      query = query.in('skill_level', params.skillLevels);
    }

    // Text search on name or username
    if (params.query && params.query.trim().length > 0) {
      query = query.or(
        `full_name.ilike.%${params.query}%,username.ilike.%${params.query}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'searchPlayers');
      return [];
    }

    // Calculate stats aggregates
    let results: ProfileWithStats[] = (data || []).map((profile: any) => {
      const stats = profile.stats || [];

      const totalGames = stats.length;
      const totalGoals = stats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
      const totalAssists = stats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0);
      const totalBlocks = stats.reduce((sum: number, s: any) => sum + (s.blocks || 0), 0);
      const totalSteals = stats.reduce((sum: number, s: any) => sum + (s.steals || 0), 0);

      const averageGoals = totalGames > 0 ? totalGoals / totalGames : 0;
      const averageAssists = totalGames > 0 ? totalAssists / totalGames : 0;

      // Remove the stats array from the result and add aggregated stats
      const { stats: _, ...profileWithoutStats } = profile;

      return {
        ...profileWithoutStats,
        total_games: totalGames,
        total_goals: totalGoals,
        total_assists: totalAssists,
        total_blocks: totalBlocks,
        total_steals: totalSteals,
        average_goals: averageGoals,
        average_assists: averageAssists,
      };
    });

    // TODO: Location-based filtering for players
    // This would require adding latitude/longitude to the profiles table
    // For now, we can't filter by location for players

    return results;
  } catch (error) {
    console.error('Error in searchPlayers:', error);
    return [];
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get nearby games within a radius
 */
export const getNearbyGames = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 25
): Promise<GameWithCreator[]> => {
  return searchGames({
    userLocation: { latitude, longitude },
    radius: radiusKm,
    status: ['open'],
  });
};

/**
 * Get upcoming games (next 7 days)
 */
export const getUpcomingGames = async (): Promise<GameWithCreator[]> => {
  return searchGames({
    dateRange: 'week',
    status: ['open'],
  });
};

/**
 * Get featured players (high skill level with good stats)
 */
export const getFeaturedPlayers = async (): Promise<ProfileWithStats[]> => {
  const players = await searchPlayers({
    skillLevels: ['advanced', 'pro'],
  });

  // Sort by total games and average goals
  return players.sort((a, b) => {
    const scoreA = a.total_games * 0.5 + a.average_goals * 2;
    const scoreB = b.total_games * 0.5 + b.average_goals * 2;
    return scoreB - scoreA;
  });
};
