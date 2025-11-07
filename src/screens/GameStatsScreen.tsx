import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { NumberStepper } from '../components/NumberStepper';

// Types
type Game = Database['public']['Tables']['games']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
type PlayerStats = Database['public']['Tables']['player_stats']['Row'];

interface ParticipantWithProfile extends GameParticipant {
  player: Profile;
}

interface GameWithParticipants extends Game {
  participants: ParticipantWithProfile[];
  creator: Profile;
}

interface ParticipantStats {
  player_id: string;
  goals: number;
  assists: number;
  blocks: number;
  steals: number;
}

interface GameStatsScreenProps {
  gameId: string;
  currentUserId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  onStatsSubmitted?: () => void;
  onSkip?: () => void;
  onBack?: () => void;
}

const MAX_STAT_VALUE = 50; // Reasonable upper limit for stats

export const GameStatsScreen: React.FC<GameStatsScreenProps> = ({
  gameId,
  currentUserId,
  supabaseUrl,
  supabaseAnonKey,
  onStatsSubmitted,
  onSkip,
  onBack,
}) => {
  const [supabase] = useState(() =>
    createClient<Database>(supabaseUrl, supabaseAnonKey)
  );

  const [game, setGame] = useState<GameWithParticipants | null>(null);
  const [participantStats, setParticipantStats] = useState<
    Map<string, ParticipantStats>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    loadGameData();
  }, [gameId]);

  const loadGameData = async () => {
    try {
      setLoading(true);

      // Fetch game with participants and creator
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(
          `
          *,
          creator:profiles!games_created_by_fkey(*),
          participants:game_participants(
            *,
            player:profiles(*)
          )
        `
        )
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      if (!gameData) throw new Error('Game not found');

      // Check if current user is the host
      const userIsHost = gameData.created_by === currentUserId;
      setIsHost(userIsHost);

      if (!userIsHost) {
        Alert.alert(
          'Access Denied',
          'Only the game host can enter stats for all participants.',
          [{ text: 'OK', onPress: onBack }]
        );
        return;
      }

      setGame(gameData as unknown as GameWithParticipants);

      // Fetch existing stats for this game
      const { data: existingStats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('game_id', gameId);

      if (statsError) throw statsError;

      // Initialize participant stats
      const statsMap = new Map<string, ParticipantStats>();

      // Filter for confirmed participants only
      const confirmedParticipants = (gameData.participants as unknown as ParticipantWithProfile[])
        .filter((p) => p.status === 'confirmed');

      confirmedParticipants.forEach((participant) => {
        const existingStat = existingStats?.find(
          (s) => s.player_id === participant.player_id
        );

        statsMap.set(participant.player_id, {
          player_id: participant.player_id,
          goals: existingStat?.goals ?? 0,
          assists: existingStat?.assists ?? 0,
          blocks: existingStat?.blocks ?? 0,
          steals: existingStat?.steals ?? 0,
        });
      });

      setParticipantStats(statsMap);
    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert('Error', 'Failed to load game data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateParticipantStat = (
    playerId: string,
    statType: keyof Omit<ParticipantStats, 'player_id'>,
    value: number
  ) => {
    setParticipantStats((prev) => {
      const newMap = new Map(prev);
      const stats = newMap.get(playerId);
      if (stats) {
        newMap.set(playerId, { ...stats, [statType]: value });
      }
      return newMap;
    });
  };

  const applyQuickStat = (playerId: string, quickStatType: 'hatTrick' | 'cleanSheet') => {
    setParticipantStats((prev) => {
      const newMap = new Map(prev);
      const stats = newMap.get(playerId);
      if (stats) {
        if (quickStatType === 'hatTrick') {
          newMap.set(playerId, { ...stats, goals: 3 });
        } else if (quickStatType === 'cleanSheet') {
          // Clean sheet for goalies - could be represented as high blocks/saves
          // For now, we'll set it as a marker with 0 goals against (not tracked in current schema)
          newMap.set(playerId, { ...stats, blocks: stats.blocks });
        }
      }
      return newMap;
    });
  };

  const validateStats = (): boolean => {
    for (const [playerId, stats] of participantStats.entries()) {
      const { goals, assists, blocks, steals } = stats;

      if (
        goals < 0 ||
        assists < 0 ||
        blocks < 0 ||
        steals < 0 ||
        goals > MAX_STAT_VALUE ||
        assists > MAX_STAT_VALUE ||
        blocks > MAX_STAT_VALUE ||
        steals > MAX_STAT_VALUE
      ) {
        Alert.alert(
          'Invalid Stats',
          `Stats must be between 0 and ${MAX_STAT_VALUE}.`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmitStats = async () => {
    if (!validateStats()) return;

    try {
      setSubmitting(true);

      // Prepare upsert data (insert or update)
      const statsToUpsert = Array.from(participantStats.values()).map(
        (stats) => ({
          game_id: gameId,
          player_id: stats.player_id,
          goals: stats.goals,
          assists: stats.assists,
          blocks: stats.blocks,
          steals: stats.steals,
        })
      );

      // Upsert stats (will insert new or update existing)
      const { error: upsertError } = await supabase
        .from('player_stats')
        .upsert(statsToUpsert, {
          onConflict: 'player_id,game_id',
        });

      if (upsertError) throw upsertError;

      // Update game status to completed if not already
      if (game?.status !== 'completed') {
        const { error: updateError } = await supabase
          .from('games')
          .update({ status: 'completed' })
          .eq('id', gameId);

        if (updateError) throw updateError;
      }

      Alert.alert(
        'Success!',
        'Player stats have been recorded successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onStatsSubmitted?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting stats:', error);
      Alert.alert('Error', 'Failed to submit stats. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Stats Entry?',
      'You can enter stats later from the game details screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onSkip },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading game data...</Text>
      </View>
    );
  }

  if (!game || !isHost) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load game data</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const confirmedParticipants = game.participants.filter(
    (p) => p.status === 'confirmed'
  );

  return (
    <View style={styles.container}>
      {/* Game Info Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{game.title}</Text>
        <Text style={styles.headerSubtitle}>
          {new Date(game.date_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.headerLocation}>{game.location}</Text>
        <View style={styles.divider} />
      </View>

      {/* Participants Stats Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          Enter Stats for {confirmedParticipants.length} Players
        </Text>

        {confirmedParticipants.map((participant) => {
          const stats = participantStats.get(participant.player_id);
          if (!stats) return null;

          const player = participant.player;
          const isGoalie = player.position === 'goalie';

          return (
            <View key={participant.id} style={styles.participantCard}>
              {/* Player Header */}
              <View style={styles.playerHeader}>
                {player.avatar_url ? (
                  <Image
                    source={{ uri: player.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {player.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.full_name}</Text>
                  <Text style={styles.playerUsername}>@{player.username}</Text>
                  {player.position && (
                    <Text style={styles.playerPosition}>
                      {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Quick Stats Buttons */}
              <View style={styles.quickStatsContainer}>
                <TouchableOpacity
                  style={styles.quickStatButton}
                  onPress={() => applyQuickStat(participant.player_id, 'hatTrick')}
                >
                  <Text style={styles.quickStatButtonText}>🎯 Hat Trick (3 goals)</Text>
                </TouchableOpacity>
                {isGoalie && (
                  <TouchableOpacity
                    style={styles.quickStatButton}
                    onPress={() => applyQuickStat(participant.player_id, 'cleanSheet')}
                  >
                    <Text style={styles.quickStatButtonText}>🧤 Clean Sheet</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Stats Inputs */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <NumberStepper
                    label="Goals"
                    value={stats.goals}
                    onChange={(value) =>
                      updateParticipantStat(participant.player_id, 'goals', value)
                    }
                    max={MAX_STAT_VALUE}
                  />
                </View>
                <View style={styles.statItem}>
                  <NumberStepper
                    label="Assists"
                    value={stats.assists}
                    onChange={(value) =>
                      updateParticipantStat(participant.player_id, 'assists', value)
                    }
                    max={MAX_STAT_VALUE}
                  />
                </View>
                <View style={styles.statItem}>
                  <NumberStepper
                    label="Blocks"
                    value={stats.blocks}
                    onChange={(value) =>
                      updateParticipantStat(participant.player_id, 'blocks', value)
                    }
                    max={MAX_STAT_VALUE}
                  />
                </View>
                <View style={styles.statItem}>
                  <NumberStepper
                    label="Steals"
                    value={stats.steals}
                    onChange={(value) =>
                      updateParticipantStat(participant.player_id, 'steals', value)
                    }
                    max={MAX_STAT_VALUE}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmitStats}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Submit Stats</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.skipButton]}
          onPress={handleSkip}
          disabled={submitting}
        >
          <Text style={[styles.buttonText, styles.skipButtonText]}>
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 24,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  headerLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  participantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  playerUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  playerPosition: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '500',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  quickStatButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickStatButtonText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 8,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButtonText: {
    color: '#6B7280',
  },
});
