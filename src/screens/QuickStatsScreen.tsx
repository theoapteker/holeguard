import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { NumberStepper } from '../components/NumberStepper';

// Types
type Game = Database['public']['Tables']['games']['Row'];
type PlayerStats = Database['public']['Tables']['player_stats']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface QuickStatsScreenProps {
  visible: boolean;
  gameId: string;
  currentUserId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  onClose: () => void;
  onStatsSubmitted?: () => void;
}

interface UserStats {
  goals: number;
  assists: number;
  blocks: number;
  steals: number;
}

const MAX_STAT_VALUE = 50;

export const QuickStatsScreen: React.FC<QuickStatsScreenProps> = ({
  visible,
  gameId,
  currentUserId,
  supabaseUrl,
  supabaseAnonKey,
  onClose,
  onStatsSubmitted,
}) => {
  const [supabase] = useState(() =>
    createClient<Database>(supabaseUrl, supabaseAnonKey)
  );

  const [game, setGame] = useState<Game | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    goals: 0,
    assists: 0,
    blocks: 0,
    steals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, gameId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      // Fetch current user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (userError) throw userError;
      setCurrentUser(userData);

      // Check if user is a confirmed participant
      const { data: participantData, error: participantError } = await supabase
        .from('game_participants')
        .select('*')
        .eq('game_id', gameId)
        .eq('player_id', currentUserId)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (participantError) throw participantError;

      if (!participantData) {
        setIsParticipant(false);
        Alert.alert(
          'Not a Participant',
          'You must be a confirmed participant to enter stats for this game.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }

      setIsParticipant(true);

      // Fetch existing stats
      const { data: existingStats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('game_id', gameId)
        .eq('player_id', currentUserId)
        .maybeSingle();

      if (statsError) throw statsError;

      // Pre-fill with existing stats or zeros
      if (existingStats) {
        setStats({
          goals: existingStats.goals,
          assists: existingStats.assists,
          blocks: existingStats.blocks,
          steals: existingStats.steals,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load game data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStat = (statType: keyof UserStats, value: number) => {
    setStats((prev) => ({ ...prev, [statType]: value }));
  };

  const applyHatTrick = () => {
    setStats((prev) => ({ ...prev, goals: 3 }));
  };

  const validateStats = (): boolean => {
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStats()) return;

    try {
      setSubmitting(true);

      // Upsert stats
      const { error: upsertError } = await supabase
        .from('player_stats')
        .upsert(
          {
            game_id: gameId,
            player_id: currentUserId,
            goals: stats.goals,
            assists: stats.assists,
            blocks: stats.blocks,
            steals: stats.steals,
          },
          {
            onConflict: 'player_id,game_id',
          }
        );

      if (upsertError) throw upsertError;

      Alert.alert(
        'Success!',
        'Your stats have been recorded successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onStatsSubmitted?.();
              onClose();
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
      'You can update your stats later from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onClose },
      ]
    );
  };

  const isGoalie = currentUser?.position === 'goalie';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Your Stats</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : !isParticipant ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              You must be a confirmed participant to enter stats.
            </Text>
          </View>
        ) : (
          <>
            {/* Game Info */}
            {game && (
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDate}>
                  {new Date(game.date_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}

            {/* Stats Form */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              <Text style={styles.sectionTitle}>How did you play?</Text>

              {/* Quick Stats Buttons */}
              <View style={styles.quickStatsContainer}>
                <TouchableOpacity
                  style={styles.quickStatButton}
                  onPress={applyHatTrick}
                >
                  <Text style={styles.quickStatButtonText}>🎯 Hat Trick (3 goals)</Text>
                </TouchableOpacity>
                {isGoalie && (
                  <View style={styles.quickStatButton}>
                    <Text style={styles.quickStatButtonText}>🧤 Goalie</Text>
                  </View>
                )}
              </View>

              {/* Stats Inputs */}
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <NumberStepper
                    label="Goals"
                    value={stats.goals}
                    onChange={(value) => updateStat('goals', value)}
                    max={MAX_STAT_VALUE}
                  />
                </View>

                <View style={styles.statRow}>
                  <NumberStepper
                    label="Assists"
                    value={stats.assists}
                    onChange={(value) => updateStat('assists', value)}
                    max={MAX_STAT_VALUE}
                  />
                </View>

                <View style={styles.statRow}>
                  <NumberStepper
                    label="Blocks"
                    value={stats.blocks}
                    onChange={(value) => updateStat('blocks', value)}
                    max={MAX_STAT_VALUE}
                  />
                </View>

                <View style={styles.statRow}>
                  <NumberStepper
                    label="Steals"
                    value={stats.steals}
                    onChange={(value) => updateStat('steals', value)}
                    max={MAX_STAT_VALUE}
                  />
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Points:</Text>
                  <Text style={styles.summaryValue}>
                    {stats.goals + stats.assists}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Defensive Actions:</Text>
                  <Text style={styles.summaryValue}>
                    {stats.blocks + stats.steals}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Save Stats</Text>
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
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 32,
    color: '#6B7280',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  gameInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  quickStatButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickStatButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statRow: {
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#075985',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
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
