import { supabase } from '../config/supabase';
import { Game } from '../types';

export const gameService = {
  /**
   * Fetch all upcoming games
   */
  async fetchGames(): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        host:users!games_host_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Join a game
   */
  async joinGame(gameId: string, userId: string): Promise<boolean> {
    // First check if user is already in the game
    const { data: existingPlayer } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      throw new Error('You have already joined this game');
    }

    // Check if game is full
    const { data: game } = await supabase
      .from('games')
      .select('current_players, max_players')
      .eq('id', gameId)
      .single();

    if (game && game.current_players >= game.max_players) {
      throw new Error('Game is full');
    }

    // Add player to game
    const { error: insertError } = await supabase
      .from('game_players')
      .insert({
        game_id: gameId,
        user_id: userId,
      });

    if (insertError) {
      console.error('Error joining game:', insertError);
      throw insertError;
    }

    // Update player count
    const { error: updateError } = await supabase
      .from('games')
      .update({
        current_players: (game?.current_players || 0) + 1,
        status: (game?.current_players || 0) + 1 >= (game?.max_players || 0) ? 'full' : 'open'
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('Error updating game:', updateError);
      throw updateError;
    }

    return true;
  },

  /**
   * Subscribe to real-time game updates
   */
  subscribeToGames(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('games_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
        },
        callback
      )
      .subscribe();

    return subscription;
  },
};
