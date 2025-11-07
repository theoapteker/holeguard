import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaderboardEntry } from '../types/stats.types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  isCurrentUser,
}) => {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return styles.gold;
    if (rank === 2) return styles.silver;
    if (rank === 3) return styles.bronze;
    return styles.defaultRank;
  };

  const getRankTextStyle = (rank: number) => {
    if (rank <= 3) return styles.topRankText;
    return styles.defaultRankText;
  };

  return (
    <View style={[styles.row, isCurrentUser && styles.currentUserRow]}>
      <View style={[styles.rankContainer, getRankStyle(entry.rank)]}>
        <Text style={getRankTextStyle(entry.rank)}>{entry.rank}</Text>
      </View>

      <View style={styles.playerInfo}>
        <Text style={[styles.name, isCurrentUser && styles.currentUserText]}>
          {entry.player.full_name}
          {isCurrentUser && ' (You)'}
        </Text>
        <Text style={styles.username}>@{entry.player.username}</Text>
      </View>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, isCurrentUser && styles.currentUserText]}>
          {entry.value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserRow: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gold: {
    backgroundColor: '#fbbf24',
  },
  silver: {
    backgroundColor: '#d1d5db',
  },
  bronze: {
    backgroundColor: '#cd7f32',
  },
  defaultRank: {
    backgroundColor: '#f3f4f6',
  },
  topRankText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultRankText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
  playerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#3b82f6',
  },
  username: {
    fontSize: 13,
    color: '#6b7280',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
});
