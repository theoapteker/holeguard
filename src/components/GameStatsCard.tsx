import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameWithStats } from '../types/stats.types';

interface GameStatsCardProps {
  game: GameWithStats;
}

export const GameStatsCard: React.FC<GameStatsCardProps> = ({ game }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stats = game.stats;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {game.title}
          </Text>
          <Text style={styles.date}>{formatDate(game.date_time)}</Text>
        </View>
        <View style={styles.statsPreview}>
          <Text style={styles.statText}>{stats.goals}G</Text>
          <Text style={styles.statText}>{stats.assists}A</Text>
          <Text style={styles.statText}>{stats.blocks}B</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.divider} />
          <Text style={styles.location}>{game.location}</Text>
          {game.description && (
            <Text style={styles.description}>{game.description}</Text>
          )}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Goals</Text>
              <Text style={styles.statValue}>{stats.goals}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Assists</Text>
              <Text style={styles.statValue}>{stats.assists}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Blocks</Text>
              <Text style={styles.statValue}>{stats.blocks}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Steals</Text>
              <Text style={styles.statValue}>{stats.steals}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
  },
  statsPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  details: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});
