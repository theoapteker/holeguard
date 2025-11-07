import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import type { GameWithDetails } from '../types/game.types';
import { GameService } from '../services/gameService';

interface UseGameDetailsOptions {
  gameId: string;
  currentUserId: string;
}

interface UseGameDetailsReturn {
  game: GameWithDetails | null;
  loading: boolean;
  refetch: () => Promise<void>;
  joinGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  cancelGame: () => Promise<void>;
  startGame: () => Promise<void>;
  isJoining: boolean;
  isLeaving: boolean;
  isHost: boolean;
  isParticipant: boolean;
  isConfirmedParticipant: boolean;
  isFull: boolean;
  isGameStarted: boolean;
  isGameCancelled: boolean;
  isGameTimeNear: boolean;
  currentPlayerCount: number;
  maxPlayers: number;
}

/**
 * Custom hook for managing game details and operations
 *
 * Features:
 * - Fetches game details with participants
 * - Real-time updates via Supabase subscriptions
 * - Game actions (join, leave, cancel, start)
 * - Computed state values
 *
 * @param options - Hook configuration
 * @returns Game data and action methods
 */
export function useGameDetails({
  gameId,
  currentUserId,
}: UseGameDetailsOptions): UseGameDetailsReturn {
  const [game, setGame] = useState<GameWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Fetch game details
  const fetchGameDetails = useCallback(async () => {
    try {
      setLoading(true);
      const gameData = await GameService.getGameWithDetails(gameId);
      setGame(gameData);
    } catch (error) {
      console.error('Error fetching game:', error);
      Alert.alert('Error', 'Failed to load game details');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Initial fetch
  useEffect(() => {
    fetchGameDetails();
  }, [fetchGameDetails]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = GameService.subscribeToGameUpdates(gameId, () => {
      fetchGameDetails();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [gameId, fetchGameDetails]);

  // Computed values
  const isHost = game?.created_by === currentUserId;
  const userParticipant = game?.participants.find(
    (p) => p.player_id === currentUserId
  );
  const isParticipant = !!userParticipant;
  const isConfirmedParticipant = userParticipant?.status === 'confirmed';
  const confirmedPlayers =
    game?.participants.filter((p) => p.status === 'confirmed') || [];
  const currentPlayerCount = confirmedPlayers.length;
  const maxPlayers = game?.max_players || 0;
  const isFull = game?.status === 'full' || currentPlayerCount >= maxPlayers;
  const isGameStarted = game?.status === 'completed';
  const isGameCancelled = game?.status === 'cancelled';
  const gameDateTime = game?.date_time ? new Date(game.date_time) : null;
  const isGameTimeNear = gameDateTime
    ? gameDateTime.getTime() - Date.now() < 2 * 60 * 60 * 1000 // Within 2 hours
    : false;

  // Actions
  const joinGame = useCallback(async () => {
    if (isFull) {
      Alert.alert('Game Full', 'This game has reached maximum capacity');
      return;
    }

    try {
      setIsJoining(true);
      await GameService.joinGame(gameId, currentUserId);
      Alert.alert('Success', 'You have joined the game!');
      await fetchGameDetails();
    } catch (error) {
      console.error('Error joining game:', error);
      Alert.alert('Error', 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  }, [gameId, currentUserId, isFull, fetchGameDetails]);

  const leaveGame = useCallback(async () => {
    return new Promise<void>((resolve) => {
      Alert.alert(
        'Leave Game',
        'Are you sure you want to leave this game?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLeaving(true);
                await GameService.leaveGame(gameId, currentUserId);
                Alert.alert('Success', 'You have left the game');
                await fetchGameDetails();
              } catch (error) {
                console.error('Error leaving game:', error);
                Alert.alert('Error', 'Failed to leave game');
              } finally {
                setIsLeaving(false);
                resolve();
              }
            },
          },
        ]
      );
    });
  }, [gameId, currentUserId, fetchGameDetails]);

  const cancelGame = useCallback(async () => {
    return new Promise<void>((resolve) => {
      Alert.alert(
        'Cancel Game',
        'Are you sure you want to cancel this game? All participants will be notified.',
        [
          { text: 'No', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                await GameService.cancelGame(gameId);
                Alert.alert('Success', 'Game has been cancelled');
                await fetchGameDetails();
              } catch (error) {
                console.error('Error cancelling game:', error);
                Alert.alert('Error', 'Failed to cancel game');
              } finally {
                resolve();
              }
            },
          },
        ]
      );
    });
  }, [gameId, fetchGameDetails]);

  const startGame = useCallback(async () => {
    return new Promise<void>((resolve) => {
      Alert.alert(
        'Start Game',
        'Mark this game as completed?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Start',
            onPress: async () => {
              try {
                await GameService.startGame(gameId);
                Alert.alert('Success', 'Game has been started!');
                await fetchGameDetails();
              } catch (error) {
                console.error('Error starting game:', error);
                Alert.alert('Error', 'Failed to start game');
              } finally {
                resolve();
              }
            },
          },
        ]
      );
    });
  }, [gameId, fetchGameDetails]);

  return {
    game,
    loading,
    refetch: fetchGameDetails,
    joinGame,
    leaveGame,
    cancelGame,
    startGame,
    isJoining,
    isLeaving,
    isHost,
    isParticipant,
    isConfirmedParticipant,
    isFull,
    isGameStarted,
    isGameCancelled,
    isGameTimeNear,
    currentPlayerCount,
    maxPlayers,
  };
}
