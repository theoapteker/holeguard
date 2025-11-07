import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { GameWithCreator } from '../types/database.types';

interface GameCardProps {
  game: GameWithCreator & {
    participants?: any[];
    confirmed_count?: number;
    distance?: number;
  };
  onPress: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#4caf50';
      case 'full':
        return '#ff9800';
      case 'completed':
        return '#9e9e9e';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const participantCount = game.confirmed_count || game.participants?.filter(p => p.status === 'confirmed').length || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {game.title}
          </Text>
          <View style={styles.statusBadge} style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
            <Text style={styles.statusText}>{game.status.toUpperCase()}</Text>
          </View>
        </View>
        {game.distance && (
          <Text style={styles.distance}>{game.distance.toFixed(1)} km</Text>
        )}
      </View>

      {/* Description */}
      {game.description && (
        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>
      )}

      {/* Details */}
      <View style={styles.details}>
        {/* Location */}
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {game.location}
          </Text>
        </View>

        {/* Date/Time */}
        <View style={styles.detailRow}>
          <Text style={styles.icon}>🕐</Text>
          <Text style={styles.detailText}>{formatDate(game.date_time)}</Text>
        </View>

        {/* Skill Level */}
        {game.skill_level_required && (
          <View style={styles.detailRow}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={styles.detailText}>
              {game.skill_level_required.charAt(0).toUpperCase() + game.skill_level_required.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Creator */}
        <View style={styles.creator}>
          <View style={styles.avatar}>
            {game.creator.avatar_url ? (
              <Image source={{ uri: game.creator.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {game.creator.full_name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.creatorName}>{game.creator.full_name}</Text>
        </View>

        {/* Players */}
        <View style={styles.players}>
          <Text style={styles.playersText}>
            {participantCount}/{game.max_players}
          </Text>
          <Text style={styles.playersIcon}>👥</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  players: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  playersIcon: {
    fontSize: 16,
  },
});
