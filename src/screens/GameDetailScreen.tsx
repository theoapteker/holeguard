import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Share as RNShare,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type {
  Game,
  Profile,
  GameParticipant,
  GameStatusType,
  SkillLevelType,
} from '../types/database.types';

// ============================================================================
// TYPES
// ============================================================================

interface GameWithDetails extends Game {
  creator: Profile;
  participants: Array<GameParticipant & { player: Profile }>;
  confirmed_count: number;
}

type RootStackParamList = {
  GameDetail: { gameId: string };
  PlayerProfile: { playerId: string };
};

type GameDetailScreenRouteProp = RouteProp<RootStackParamList, 'GameDetail'>;
type GameDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function GameDetailScreen() {
  const navigation = useNavigation<GameDetailScreenNavigationProp>();
  const route = useRoute<GameDetailScreenRouteProp>();
  const { gameId } = route.params;

  // State
  const [game, setGame] = useState<GameWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>(''); // TODO: Get from auth context
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Computed values
  const isHost = game?.created_by === currentUserId;
  const userParticipant = game?.participants.find(
    (p) => p.player_id === currentUserId
  );
  const isParticipant = !!userParticipant;
  const isConfirmedParticipant = userParticipant?.status === 'confirmed';
  const confirmedPlayers = game?.participants.filter((p) => p.status === 'confirmed') || [];
  const currentPlayerCount = confirmedPlayers.length;
  const maxPlayers = game?.max_players || 0;
  const isFull = game?.status === 'full' || currentPlayerCount >= maxPlayers;
  const isGameStarted = game?.status === 'completed';
  const isGameCancelled = game?.status === 'cancelled';
  const gameDateTime = game?.date_time ? new Date(game.date_time) : null;
  const isGameTimeNear = gameDateTime
    ? gameDateTime.getTime() - Date.now() < 2 * 60 * 60 * 1000 // Within 2 hours
    : false;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchGameDetails = useCallback(async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('games')
      //   .select(`
      //     *,
      //     creator:profiles!games_created_by_fkey(*),
      //     participants:game_participants(
      //       *,
      //       player:profiles(*)
      //     )
      //   `)
      //   .eq('id', gameId)
      //   .single();

      // Mock data for development
      const mockGame: GameWithDetails = {
        id: gameId,
        created_by: 'user-123',
        title: 'Sunday Afternoon Pickup Game',
        description: 'Looking for players of all skill levels for a fun, competitive water polo game. We\'ll play for about 2 hours with breaks. Bring your own gear!',
        location: 'Downtown Community Pool',
        pool_address: '123 Main Street, San Francisco, CA 94102',
        latitude: 37.7749,
        longitude: -122.4194,
        date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        max_players: 12,
        skill_level_required: 'intermediate',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: {
          id: 'user-123',
          username: 'johnplayer',
          full_name: 'John Smith',
          position: 'driver',
          skill_level: 'advanced',
          location: 'San Francisco, CA',
          bio: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        participants: [
          {
            id: 'part-1',
            game_id: gameId,
            player_id: 'user-123',
            status: 'confirmed',
            created_at: new Date().toISOString(),
            player: {
              id: 'user-123',
              username: 'johnplayer',
              full_name: 'John Smith',
              position: 'driver',
              skill_level: 'advanced',
              location: 'San Francisco, CA',
              bio: null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ],
        confirmed_count: 1,
      };

      setGame(mockGame);
      setCurrentUserId('user-456'); // Mock current user
    } catch (error) {
      console.error('Error fetching game:', error);
      Alert.alert('Error', 'Failed to load game details');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameDetails();
  }, [fetchGameDetails]);

  // Real-time updates
  useEffect(() => {
    // TODO: Set up Supabase real-time subscription
    // const subscription = supabase
    //   .channel(`game:${gameId}`)
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: 'game_participants',
    //     filter: `game_id=eq.${gameId}`,
    //   }, () => {
    //     fetchGameDetails();
    //   })
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, [gameId, fetchGameDetails]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleJoinGame = async () => {
    if (isFull) {
      Alert.alert('Game Full', 'This game has reached maximum capacity');
      return;
    }

    try {
      setIsJoining(true);

      // TODO: Replace with actual Supabase mutation
      // const { error } = await supabase
      //   .from('game_participants')
      //   .insert({
      //     game_id: gameId,
      //     player_id: currentUserId,
      //     status: 'confirmed',
      //   });

      Alert.alert('Success', 'You have joined the game!');
      await fetchGameDetails();
    } catch (error) {
      console.error('Error joining game:', error);
      Alert.alert('Error', 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGame = async () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLeaving(true);

              // TODO: Replace with actual Supabase mutation
              // const { error } = await supabase
              //   .from('game_participants')
              //   .delete()
              //   .eq('game_id', gameId)
              //   .eq('player_id', currentUserId);

              Alert.alert('Success', 'You have left the game');
              await fetchGameDetails();
            } catch (error) {
              console.error('Error leaving game:', error);
              Alert.alert('Error', 'Failed to leave game');
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelGame = async () => {
    Alert.alert(
      'Cancel Game',
      'Are you sure you want to cancel this game? All participants will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual Supabase mutation
              // const { error } = await supabase
              //   .from('games')
              //   .update({ status: 'cancelled' })
              //   .eq('id', gameId);

              Alert.alert('Success', 'Game has been cancelled');
              await fetchGameDetails();
            } catch (error) {
              console.error('Error cancelling game:', error);
              Alert.alert('Error', 'Failed to cancel game');
            }
          },
        },
      ]
    );
  };

  const handleStartGame = async () => {
    Alert.alert(
      'Start Game',
      'Mark this game as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              // TODO: Replace with actual Supabase mutation
              // const { error } = await supabase
              //   .from('games')
              //   .update({ status: 'completed' })
              //   .eq('id', gameId);

              Alert.alert('Success', 'Game has been started!');
              await fetchGameDetails();
            } catch (error) {
              console.error('Error starting game:', error);
              Alert.alert('Error', 'Failed to start game');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Join me for water polo! ${game?.title}\n${game?.location}\n${formatDateTime(game?.date_time || '')}`,
        title: game?.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGetDirections = () => {
    if (!game?.latitude || !game?.longitude) {
      Alert.alert('Error', 'Location coordinates not available');
      return;
    }

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${game.latitude},${game.longitude}`;
    const label = game.location;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handlePlayerPress = (playerId: string) => {
    navigation.navigate('PlayerProfile', { playerId });
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSkillLevelColor = (skillLevel: SkillLevelType | null) => {
    switch (skillLevel) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#2196F3';
      case 'advanced':
        return '#FF9800';
      case 'pro':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusBadgeColor = (status: GameStatusType) => {
    switch (status) {
      case 'open':
        return '#4CAF50';
      case 'full':
        return '#FF9800';
      case 'completed':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading game details...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Game Status Banner */}
      {(isGameCancelled || isGameStarted) && (
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: getStatusBadgeColor(game.status) },
          ]}
        >
          <Text style={styles.statusBannerText}>
            {isGameCancelled ? 'GAME CANCELLED' : 'GAME COMPLETED'}
          </Text>
        </View>
      )}

      {/* Title Section */}
      <View style={styles.section}>
        <Text style={styles.title}>{game.title}</Text>
        <View style={styles.badgeContainer}>
          {game.skill_level_required && (
            <View
              style={[
                styles.badge,
                { backgroundColor: getSkillLevelColor(game.skill_level_required) },
              ]}
            >
              <Text style={styles.badgeText}>
                {game.skill_level_required.toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: getStatusBadgeColor(game.status) },
            ]}
          >
            <Text style={styles.badgeText}>{game.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Date & Time - Prominent */}
      <View style={styles.dateTimeSection}>
        <Text style={styles.dateTimeLabel}>Game Time</Text>
        <Text style={styles.dateTimeValue}>{formatDateTime(game.date_time)}</Text>
      </View>

      {/* Host Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hosted By</Text>
        <TouchableOpacity
          style={styles.hostCard}
          onPress={() => handlePlayerPress(game.creator.id)}
        >
          <Image
            source={{
              uri: game.creator.avatar_url || 'https://via.placeholder.com/50',
            }}
            style={styles.hostAvatar}
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{game.creator.full_name}</Text>
            <Text style={styles.hostUsername}>@{game.creator.username}</Text>
            {game.creator.skill_level && (
              <View
                style={[
                  styles.skillBadge,
                  { backgroundColor: getSkillLevelColor(game.creator.skill_level) },
                ]}
              >
                <Text style={styles.skillBadgeText}>
                  {game.creator.skill_level}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {game.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{game.description}</Text>
        </View>
      )}

      {/* Location & Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.locationName}>{game.location}</Text>
        <Text style={styles.locationAddress}>{game.pool_address}</Text>

        {game.latitude && game.longitude && (
          <>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: game.latitude,
                longitude: game.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: game.latitude,
                  longitude: game.longitude,
                }}
                title={game.location}
                description={game.pool_address}
              />
            </MapView>

            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Player Capacity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Players</Text>
        <View style={styles.capacityBar}>
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityText}>
              {currentPlayerCount} / {maxPlayers} Players
            </Text>
            {isFull && <Text style={styles.fullText}>FULL</Text>}
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(currentPlayerCount / maxPlayers) * 100}%`,
                  backgroundColor: isFull ? '#FF9800' : '#4CAF50',
                },
              ]}
            />
          </View>
        </View>

        {/* Player List */}
        <View style={styles.playerList}>
          {confirmedPlayers.map((participant) => (
            <TouchableOpacity
              key={participant.id}
              style={styles.playerCard}
              onPress={() => handlePlayerPress(participant.player.id)}
            >
              <Image
                source={{
                  uri:
                    participant.player.avatar_url ||
                    'https://via.placeholder.com/40',
                }}
                style={styles.playerAvatar}
              />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {participant.player.full_name}
                </Text>
                <Text style={styles.playerUsername}>
                  @{participant.player.username}
                </Text>
              </View>
              {participant.player.skill_level && (
                <View
                  style={[
                    styles.playerSkillBadge,
                    {
                      backgroundColor: getSkillLevelColor(
                        participant.player.skill_level
                      ),
                    },
                  ]}
                >
                  <Text style={styles.playerSkillBadgeText}>
                    {participant.player.skill_level.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {!isGameCancelled && !isGameStarted && (
          <>
            {isHost ? (
              <>
                {isGameTimeNear && (
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleStartGame}
                  >
                    <Text style={styles.buttonText}>Start Game</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={handleCancelGame}
                >
                  <Text style={styles.buttonText}>Cancel Game</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {isConfirmedParticipant ? (
                  <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={handleLeaveGame}
                    disabled={isLeaving}
                  >
                    <Text style={styles.buttonText}>
                      {isLeaving ? 'Leaving...' : 'Leave Game'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.primaryButton,
                      isFull && styles.disabledButton,
                    ]}
                    onPress={handleJoinGame}
                    disabled={isFull || isJoining}
                  >
                    <Text style={styles.buttonText}>
                      {isJoining ? 'Joining...' : isFull ? 'Game Full' : 'Join Game'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleShare}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Share Game
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    fontWeight: '600',
  },
  statusBanner: {
    padding: 12,
    alignItems: 'center',
  },
  statusBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateTimeSection: {
    backgroundColor: '#2196F3',
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  dateTimeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTimeValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
  },
  hostInfo: {
    marginLeft: 12,
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  hostUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  skillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  skillBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  directionsButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  capacityBar: {
    marginBottom: 16,
  },
  capacityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  fullText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  playerList: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  playerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  playerUsername: {
    fontSize: 14,
    color: '#666',
  },
  playerSkillBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSkillBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
  bottomSpacer: {
    height: 24,
  },
});
