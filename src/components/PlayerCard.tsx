import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { ProfileWithStats } from '../types/database.types';

interface PlayerCardProps {
  player: ProfileWithStats & {
    distance?: number;
  };
  onPress: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onPress }) => {
  const getPositionEmoji = (position: string | null) => {
    switch (position) {
      case 'goalie':
        return '🥅';
      case 'driver':
        return '🚀';
      case 'wing':
        return '🦅';
      case 'center':
        return '⭐';
      default:
        return '🏊';
    }
  };

  const getSkillLevelColor = (level: string | null) => {
    switch (level) {
      case 'beginner':
        return '#4caf50';
      case 'intermediate':
        return '#2196f3';
      case 'advanced':
        return '#9c27b0';
      case 'pro':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {player.avatar_url ? (
          <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {player.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {player.position && (
          <View style={styles.positionBadge}>
            <Text style={styles.positionEmoji}>{getPositionEmoji(player.position)}</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>
        {player.full_name}
      </Text>
      <Text style={styles.username} numberOfLines={1}>
        @{player.username}
      </Text>

      {/* Position & Skill Level */}
      <View style={styles.badges}>
        {player.position && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
            </Text>
          </View>
        )}
        {player.skill_level && (
          <View style={[styles.badge, { backgroundColor: getSkillLevelColor(player.skill_level) }]}>
            <Text style={styles.badgeText}>
              {player.skill_level.charAt(0).toUpperCase() + player.skill_level.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{player.total_games || 0}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{player.total_goals || 0}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {player.total_games > 0 ? (player.average_goals || 0).toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Avg</Text>
        </View>
      </View>

      {/* Distance */}
      {player.distance && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distance}>{player.distance.toFixed(1)} km away</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  positionBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f5f5f5',
  },
  positionEmoji: {
    fontSize: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0066cc',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f0f0f0',
  },
  distanceContainer: {
    marginTop: 8,
  },
  distance: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Profile } from '../types/database.types';
import { PlayerAvatar } from './PlayerAvatar';
import { SkillBadge } from './SkillBadge';

interface PlayerCardProps {
  player: Profile;
  onPress?: (playerId: string) => void;
  showSkill?: boolean;
}

/**
 * PlayerCard Component
 *
 * Displays a player's information in a compact card format
 *
 * @param player - The player's profile data
 * @param onPress - Callback when card is pressed
 * @param showSkill - Whether to show skill level badge (default: true)
 */
export function PlayerCard({ player, onPress, showSkill = true }: PlayerCardProps) {
  const handlePress = () => {
    onPress?.(player.id);
  };

  const content = (
    <>
      <PlayerAvatar avatarUrl={player.avatar_url} name={player.full_name} size={40} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {player.full_name}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{player.username}
        </Text>
      </View>
      {showSkill && player.skill_level && (
        <View style={styles.badgeContainer}>
          <SkillBadge skillLevel={player.skill_level} size="small" showLabel={false} />
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badgeContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
