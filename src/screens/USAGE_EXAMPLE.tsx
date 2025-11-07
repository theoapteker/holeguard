/**
 * USAGE EXAMPLES
 *
 * This file demonstrates how to integrate the GameStatsScreen and QuickStatsScreen
 * into your React Native application.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { GameStatsScreen, QuickStatsScreen } from './index';
import type { Database } from '../types/database.types';

// Initialize Supabase (typically done in a separate config file)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// EXAMPLE 1: Game Details Screen (Host View)
// ============================================================================

interface GameDetailsScreenProps {
  gameId: string;
  currentUserId: string;
}

export const GameDetailsScreen: React.FC<GameDetailsScreenProps> = ({
  gameId,
  currentUserId,
}) => {
  const [game, setGame] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [showStatsEntry, setShowStatsEntry] = useState(false);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (data) {
      setGame(data);
      setIsHost(data.created_by === currentUserId);
    }
  };

  const handleCompleteGame = async () => {
    // Mark game as completed
    await supabase
      .from('games')
      .update({ status: 'completed' })
      .eq('id', gameId);

    // Show stats entry screen
    setShowStatsEntry(true);
  };

  if (showStatsEntry) {
    return (
      <GameStatsScreen
        gameId={gameId}
        currentUserId={currentUserId}
        supabaseUrl={SUPABASE_URL}
        supabaseAnonKey={SUPABASE_ANON_KEY}
        onStatsSubmitted={() => {
          setShowStatsEntry(false);
          loadGame(); // Refresh game data
        }}
        onSkip={() => {
          setShowStatsEntry(false);
        }}
        onBack={() => {
          setShowStatsEntry(false);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{game?.title}</Text>
      <Text style={styles.subtitle}>Status: {game?.status}</Text>

      {isHost && game?.status === 'open' && (
        <TouchableOpacity style={styles.button} onPress={handleCompleteGame}>
          <Text style={styles.buttonText}>Complete Game & Enter Stats</Text>
        </TouchableOpacity>
      )}

      {isHost && game?.status === 'completed' && (
        <TouchableOpacity style={styles.button} onPress={() => setShowStatsEntry(true)}>
          <Text style={styles.buttonText}>Edit Stats</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// EXAMPLE 2: Player View with Quick Stats Modal
// ============================================================================

interface MyGamesScreenProps {
  currentUserId: string;
}

export const MyGamesScreen: React.FC<MyGamesScreenProps> = ({ currentUserId }) => {
  const [games, setGames] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [showQuickStats, setShowQuickStats] = useState(false);

  useEffect(() => {
    loadMyGames();
  }, []);

  const loadMyGames = async () => {
    // Fetch games where user is a participant
    const { data, error } = await supabase
      .from('game_participants')
      .select(
        `
        *,
        game:games(*)
      `
      )
      .eq('player_id', currentUserId)
      .eq('status', 'confirmed');

    if (data) {
      setGames(data.map((p: any) => p.game));
    }
  };

  const handleAddStats = (gameId: string) => {
    setSelectedGameId(gameId);
    setShowQuickStats(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Games</Text>

      {games.map((game) => (
        <View key={game.id} style={styles.gameCard}>
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.gameDate}>
            {new Date(game.date_time).toLocaleDateString()}
          </Text>

          {game.status === 'completed' && (
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => handleAddStats(game.id)}
            >
              <Text style={styles.smallButtonText}>Add My Stats</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {selectedGameId && (
        <QuickStatsScreen
          visible={showQuickStats}
          gameId={selectedGameId}
          currentUserId={currentUserId}
          supabaseUrl={SUPABASE_URL}
          supabaseAnonKey={SUPABASE_ANON_KEY}
          onClose={() => {
            setShowQuickStats(false);
            setSelectedGameId(null);
          }}
          onStatsSubmitted={() => {
            setShowQuickStats(false);
            setSelectedGameId(null);
            loadMyGames(); // Refresh games
          }}
        />
      )}
    </View>
  );
};

// ============================================================================
// EXAMPLE 3: Automatic Quick Stats Prompt After Game
// ============================================================================

interface PostGameScreenProps {
  gameId: string;
  currentUserId: string;
}

export const PostGameScreen: React.FC<PostGameScreenProps> = ({
  gameId,
  currentUserId,
}) => {
  const [showQuickStats, setShowQuickStats] = useState(true);

  return (
    <View style={styles.container}>
      <QuickStatsScreen
        visible={showQuickStats}
        gameId={gameId}
        currentUserId={currentUserId}
        supabaseUrl={SUPABASE_URL}
        supabaseAnonKey={SUPABASE_ANON_KEY}
        onClose={() => {
          setShowQuickStats(false);
          // Navigate to game details or home
        }}
        onStatsSubmitted={() => {
          setShowQuickStats(false);
          // Show thank you message or navigate
        }}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 4: React Navigation Integration
// ============================================================================

/*
// In your navigation stack:

import { createStackNavigator } from '@react-navigation/stack';
import { GameStatsScreen } from './screens';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={{ title: 'Game Details' }}
      />
      <Stack.Screen
        name="GameStats"
        component={GameStatsScreen}
        options={{ title: 'Enter Game Stats' }}
      />
    </Stack.Navigator>
  );
};

// Navigate to GameStatsScreen:
navigation.navigate('GameStats', {
  gameId: game.id,
  currentUserId: user.id,
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
});
*/

// ============================================================================
// EXAMPLE 5: Expo Router Integration
// ============================================================================

/*
// app/game-stats/[id].tsx

import { useLocalSearchParams, router } from 'expo-router';
import { GameStatsScreen } from '../../../src/screens';
import { useAuth } from '../../../src/hooks/useAuth';

export default function GameStatsPage() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  return (
    <GameStatsScreen
      gameId={id as string}
      currentUserId={user.id}
      supabaseUrl={process.env.EXPO_PUBLIC_SUPABASE_URL!}
      supabaseAnonKey={process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}
      onStatsSubmitted={() => {
        router.back();
      }}
      onSkip={() => {
        router.back();
      }}
      onBack={() => {
        router.back();
      }}
    />
  );
}
*/

// ============================================================================
// EXAMPLE 6: With Custom Supabase Context
// ============================================================================

/*
// Create a Supabase context:

import { createContext, useContext } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const SupabaseContext = createContext<SupabaseClient<Database>>(supabase);

export const useSupabase = () => useContext(SupabaseContext);

// Then modify the GameStatsScreen to use this context instead of props
*/

// ============================================================================
// EXAMPLE 7: With Real-time Updates
// ============================================================================

export const GameStatsWithRealtimeScreen: React.FC<GameDetailsScreenProps> = ({
  gameId,
  currentUserId,
}) => {
  const [showStatsEntry, setShowStatsEntry] = useState(false);

  useEffect(() => {
    // Subscribe to game status changes
    const subscription = supabase
      .channel('game-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            // Automatically show stats entry when game is marked as completed
            setShowStatsEntry(true);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId]);

  if (showStatsEntry) {
    return (
      <GameStatsScreen
        gameId={gameId}
        currentUserId={currentUserId}
        supabaseUrl={SUPABASE_URL}
        supabaseAnonKey={SUPABASE_ANON_KEY}
        onStatsSubmitted={() => setShowStatsEntry(false)}
        onSkip={() => setShowStatsEntry(false)}
        onBack={() => setShowStatsEntry(false)}
      />
    );
  }

  return <View style={styles.container}>{/* Game details UI */}</View>;
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  smallButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
});
