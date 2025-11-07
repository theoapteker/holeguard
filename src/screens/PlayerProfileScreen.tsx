/**
 * PlayerProfileScreen - View any player's profile
 *
 * Features:
 * - Display player information (avatar, username, position, skill level, location)
 * - Stats overview (total games, goals, assists, blocks, averages)
 * - Recent games list
 * - Bio section
 * - Tab navigation between "Stats" and "Games"
 * - "Edit Profile" button (only for own profile)
 * - Loading skeleton while fetching data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { supabase } from '../services/supabase';
import type {
  Profile,
  PlayerStats,
  Game,
  SkillLevelType,
  PositionType,
} from '../types/database.types';

const { width } = Dimensions.get('window');

interface PlayerProfileScreenProps {
  // Navigation props
  route?: {
    params?: {
      playerId?: string; // If not provided, show current user's profile
    };
  };
  navigation?: any;
}

interface PlayerStatsWithGame extends PlayerStats {
  game: Game;
}

interface AggregatedStats {
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  totalBlocks: number;
  totalSteals: number;
  avgGoalsPerGame: number;
  avgAssistsPerGame: number;
}

type TabType = 'Stats' | 'Games';

export default function PlayerProfileScreen({ route, navigation }: PlayerProfileScreenProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStatsWithGame[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Stats');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const playerId = route?.params?.playerId;

  useEffect(() => {
    loadData();
    getCurrentUser();
  }, [playerId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // If no playerId provided, fetch current user
      const targetPlayerId = playerId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetPlayerId) {
        throw new Error('No player ID available');
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetPlayerId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch player stats with game details
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select(`
          *,
          game:games(*)
        `)
        .eq('player_id', targetPlayerId)
        .order('created_at', { ascending: false });

      if (statsError) throw statsError;
      setStats(statsData as PlayerStatsWithGame[]);

      // Calculate aggregated stats
      if (statsData && statsData.length > 0) {
        const totals = statsData.reduce(
          (acc, stat) => ({
            goals: acc.goals + stat.goals,
            assists: acc.assists + stat.assists,
            blocks: acc.blocks + stat.blocks,
            steals: acc.steals + stat.steals,
          }),
          { goals: 0, assists: 0, blocks: 0, steals: 0 }
        );

        setAggregatedStats({
          totalGames: statsData.length,
          totalGoals: totals.goals,
          totalAssists: totals.assists,
          totalBlocks: totals.blocks,
          totalSteals: totals.steals,
          avgGoalsPerGame: statsData.length > 0 ? totals.goals / statsData.length : 0,
          avgAssistsPerGame: statsData.length > 0 ? totals.assists / statsData.length : 0,
        });
      } else {
        setAggregatedStats({
          totalGames: 0,
          totalGoals: 0,
          totalAssists: 0,
          totalBlocks: 0,
          totalSteals: 0,
          avgGoalsPerGame: 0,
          avgAssistsPerGame: 0,
        });
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation?.navigate('EditProfile', { profile });
  };

  const isOwnProfile = currentUserId && profile?.id === currentUserId;

  if (loading && !profile) {
    return <LoadingSkeleton />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditPress={handleEditProfile}
      />

      {/* Bio Section */}
      {profile.bio && (
        <View style={styles.bioContainer}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Stats' && styles.activeTab]}
          onPress={() => setActiveTab('Stats')}
        >
          <Text style={[styles.tabText, activeTab === 'Stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Games' && styles.activeTab]}
          onPress={() => setActiveTab('Games')}
        >
          <Text style={[styles.tabText, activeTab === 'Games' && styles.activeTabText]}>
            Games
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Based on Active Tab */}
      {activeTab === 'Stats' ? (
        <StatsSection aggregatedStats={aggregatedStats} />
      ) : (
        <RecentGamesSection stats={stats} />
      )}
    </ScrollView>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  onEditPress: () => void;
}

function ProfileHeader({ profile, isOwnProfile, onEditPress }: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {profile.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* User Info */}
      <Text style={styles.username}>@{profile.username}</Text>
      <Text style={styles.fullName}>{profile.full_name}</Text>

      {/* Badges */}
      <View style={styles.badgesContainer}>
        {profile.position && <PositionBadge position={profile.position} />}
        {profile.skill_level && <SkillLevelBadge skillLevel={profile.skill_level} />}
      </View>

      {/* Location */}
      {profile.location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>
      )}

      {/* Edit Button (only for own profile) */}
      {isOwnProfile && (
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PositionBadge({ position }: { position: PositionType }) {
  const positionLabels: Record<PositionType, string> = {
    goalie: 'Goalie',
    driver: 'Driver',
    wing: 'Wing',
    center: 'Center',
  };

  const positionColors: Record<PositionType, string> = {
    goalie: '#FF6B6B',
    driver: '#4ECDC4',
    wing: '#45B7D1',
    center: '#FFA07A',
  };

  return (
    <View style={[styles.badge, { backgroundColor: positionColors[position] }]}>
      <Text style={styles.badgeText}>{positionLabels[position]}</Text>
    </View>
  );
}

function SkillLevelBadge({ skillLevel }: { skillLevel: SkillLevelType }) {
  const skillLevelLabels: Record<SkillLevelType, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    pro: 'Pro',
  };

  const skillLevelColors: Record<SkillLevelType, string> = {
    beginner: '#95E1D3',
    intermediate: '#F38181',
    advanced: '#AA96DA',
    pro: '#FCBAD3',
  };

  return (
    <View style={[styles.badge, { backgroundColor: skillLevelColors[skillLevel] }]}>
      <Text style={styles.badgeText}>{skillLevelLabels[skillLevel]}</Text>
    </View>
  );
}

function StatsSection({ aggregatedStats }: { aggregatedStats: AggregatedStats | null }) {
  if (!aggregatedStats) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No stats available yet</Text>
      </View>
    );
  }

  const statCards = [
    { label: 'Games Played', value: aggregatedStats.totalGames, icon: '🏊' },
    { label: 'Total Goals', value: aggregatedStats.totalGoals, icon: '⚽' },
    { label: 'Total Assists', value: aggregatedStats.totalAssists, icon: '🤝' },
    { label: 'Total Blocks', value: aggregatedStats.totalBlocks, icon: '🛡️' },
    { label: 'Avg Goals/Game', value: aggregatedStats.avgGoalsPerGame.toFixed(1), icon: '📊' },
    { label: 'Avg Assists/Game', value: aggregatedStats.avgAssistsPerGame.toFixed(1), icon: '📈' },
  ];

  return (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Stats Overview</Text>
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RecentGamesSection({ stats }: { stats: PlayerStatsWithGame[] }) {
  if (stats.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No games played yet</Text>
      </View>
    );
  }

  const recentGames = stats.slice(0, 5);

  return (
    <View style={styles.gamesSection}>
      <Text style={styles.sectionTitle}>Recent Games</Text>
      {recentGames.map((stat) => (
        <GameCard key={stat.id} stat={stat} />
      ))}
    </View>
  );
}

function GameCard({ stat }: { stat: PlayerStatsWithGame }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.gameCard}>
      <View style={styles.gameCardHeader}>
        <Text style={styles.gameTitle}>{stat.game.title}</Text>
        <Text style={styles.gameDate}>{formatDate(stat.game.date_time)}</Text>
      </View>
      <Text style={styles.gameLocation}>📍 {stat.game.location}</Text>
      <View style={styles.gameStatsContainer}>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{stat.goals}</Text>
          <Text style={styles.gameStatLabel}>Goals</Text>
        </View>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{stat.assists}</Text>
          <Text style={styles.gameStatLabel}>Assists</Text>
        </View>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{stat.blocks}</Text>
          <Text style={styles.gameStatLabel}>Blocks</Text>
        </View>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{stat.steals}</Text>
          <Text style={styles.gameStatLabel}>Steals</Text>
        </View>
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatarPlaceholder, styles.skeleton]} />
        <View style={[styles.skeletonText, { width: 120, marginTop: 16 }]} />
        <View style={[styles.skeletonText, { width: 180, marginTop: 8 }]} />
        <View style={styles.badgesContainer}>
          <View style={[styles.skeletonBadge]} />
          <View style={[styles.skeletonBadge]} />
        </View>
      </View>
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.statCard, styles.skeleton]} />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF1',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bioContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8ECF1',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    borderBottomWidth: 1,
    borderColor: '#E8ECF1',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsSection: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: (width - 60) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  gamesSection: {
    padding: 24,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  gameDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  gameLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  gameStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF1',
  },
  gameStat: {
    alignItems: 'center',
  },
  gameStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  gameStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyStateContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
  },
  skeleton: {
    backgroundColor: '#E8ECF1',
  },
  skeletonText: {
    height: 20,
    backgroundColor: '#E8ECF1',
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 28,
    backgroundColor: '#E8ECF1',
    borderRadius: 16,
  },
});
