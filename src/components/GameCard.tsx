import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Game } from '../types';
import SkillBadge from './SkillBadge';
import StatusBadge from './StatusBadge';
import Avatar from './Avatar';

interface GameCardProps {
  game: Game;
  onJoin: (gameId: string) => void;
}

export default function GameCard({ game, onJoin }: GameCardProps) {
  const isFull = game.current_players >= game.max_players || game.status === 'full';
  const formattedDate = format(new Date(game.date_time), 'EEE, MMM d');
  const formattedTime = format(new Date(game.date_time), 'h:mm a');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{game.title}</Text>
          <StatusBadge status={game.status} />
        </View>
        <SkillBadge level={game.skill_level} />
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.infoText}>{game.pool_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.infoText}>{formattedDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>🕐</Text>
          <Text style={styles.infoText}>{formattedTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>👥</Text>
          <Text style={styles.infoText}>
            {game.current_players}/{game.max_players} players
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.host}>
          <Avatar
            name={game.host?.full_name || 'Unknown'}
            imageUrl={game.host?.avatar_url}
            size={32}
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostLabel}>Host</Text>
            <Text style={styles.hostName}>{game.host?.full_name || 'Unknown'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isFull && styles.buttonDisabled]}
          onPress={() => onJoin(game.id)}
          disabled={isFull}
        >
          <Text style={[styles.buttonText, isFull && styles.buttonTextDisabled]}>
            {isFull ? 'FULL' : 'JOIN'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
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
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  info: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  host: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostInfo: {
    marginLeft: 8,
  },
  hostLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
});
