import { supabase } from '../lib/supabase';
import {
  PlayerStatsSummary,
  GameWithStats,
  PositionStats,
  GoalsOverTime,
  LeaderboardEntry,
  LeaderboardCategory,
} from '../types/stats.types';
import { DateRangeFilter, getDateRangeStart } from '../utils/dateFilters';

/**
 * Fetch player statistics summary
 */
export const fetchPlayerStatsSummary = async (
  playerId: string,
  dateFilter: DateRangeFilter = 'all'
): Promise<PlayerStatsSummary> => {
  let query = supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId);

  const startDate = getDateRangeStart(dateFilter);
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats: PlayerStatsSummary = {
    totalGames: data?.length || 0,
    totalGoals: data?.reduce((sum, stat) => sum + stat.goals, 0) || 0,
    totalAssists: data?.reduce((sum, stat) => sum + stat.assists, 0) || 0,
    totalBlocks: data?.reduce((sum, stat) => sum + stat.blocks, 0) || 0,
    totalSteals: data?.reduce((sum, stat) => sum + stat.steals, 0) || 0,
    averageGoals: 0,
    averageAssists: 0,
    averageBlocks: 0,
  };

  if (stats.totalGames > 0) {
    stats.averageGoals = stats.totalGoals / stats.totalGames;
    stats.averageAssists = stats.totalAssists / stats.totalGames;
    stats.averageBlocks = stats.totalBlocks / stats.totalGames;
  }

  return stats;
};

/**
 * Fetch recent games with stats
 */
export const fetchRecentGames = async (
  playerId: string,
  limit: number = 10
): Promise<GameWithStats[]> => {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      game:games(*)
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((item) => ({
    ...(item.game as any),
    stats: {
      id: item.id,
      player_id: item.player_id,
      game_id: item.game_id,
      goals: item.goals,
      assists: item.assists,
      blocks: item.blocks,
      steals: item.steals,
      created_at: item.created_at,
    },
  }));
};

/**
 * Fetch goals over time for chart
 */
export const fetchGoalsOverTime = async (
  playerId: string,
  dateFilter: DateRangeFilter = 'month'
): Promise<GoalsOverTime[]> => {
  let query = supabase
    .from('player_stats')
    .select(`
      goals,
      created_at,
      game:games(date_time)
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: true });

  const startDate = getDateRangeStart(dateFilter);
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((item) => {
    const game = item.game as any;
    return {
      date: new Date(game?.date_time || item.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      goals: item.goals,
      gameDate: new Date(game?.date_time || item.created_at),
    };
  });
};

/**
 * Fetch position breakdown
 */
export const fetchPositionBreakdown = async (
  playerId: string,
  dateFilter: DateRangeFilter = 'all'
): Promise<PositionStats[]> => {
  // This is a simplified version. In a real app, you'd track position per game
  // For now, we'll just return the player's primary position
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('position')
    .eq('id', playerId)
    .single();

  if (error) throw error;

  let query = supabase
    .from('player_stats')
    .select('id')
    .eq('player_id', playerId);

  const startDate = getDateRangeStart(dateFilter);
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data: stats, error: statsError } = await query;

  if (statsError) throw statsError;

  return [
    {
      position: profile?.position || 'Unknown',
      gamesPlayed: stats?.length || 0,
    },
  ];
};

/**
 * Fetch leaderboard data
 */
export const fetchLeaderboard = async (
  category: LeaderboardCategory,
  dateFilter: DateRangeFilter = 'month',
  limit: number = 100
): Promise<LeaderboardEntry[]> => {
  let query = supabase.from('player_stats').select(`
      *,
      player:profiles(*)
    `);

  const startDate = getDateRangeStart(dateFilter);
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aggregate stats by player
  const playerStatsMap = new Map<string, { player: any; stats: any[] }>();

  (data || []).forEach((item) => {
    const playerId = item.player_id;
    if (!playerStatsMap.has(playerId)) {
      playerStatsMap.set(playerId, {
        player: item.player,
        stats: [],
      });
    }
    playerStatsMap.get(playerId)!.stats.push(item);
  });

  // Calculate totals and create leaderboard entries
  const entries: LeaderboardEntry[] = Array.from(playerStatsMap.values())
    .map(({ player, stats }) => {
      let value = 0;

      switch (category) {
        case 'goals':
          value = stats.reduce((sum, s) => sum + s.goals, 0);
          break;
        case 'assists':
          value = stats.reduce((sum, s) => sum + s.assists, 0);
          break;
        case 'blocks':
          value = stats.reduce((sum, s) => sum + s.blocks, 0);
          break;
        case 'games':
          value = stats.length;
          break;
      }

      return {
        player,
        value,
        rank: 0, // Will be set after sorting
      };
    })
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
};

/**
 * Fetch top scorers preview (top 5)
 */
export const fetchTopScorersPreview = async (
  dateFilter: DateRangeFilter = 'month'
): Promise<LeaderboardEntry[]> => {
  return fetchLeaderboard('goals', dateFilter, 5);
};
