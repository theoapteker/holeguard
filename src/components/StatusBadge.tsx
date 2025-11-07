import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameStatus } from '../types';

interface StatusBadgeProps {
  status: GameStatus;
}

const STATUS_CONFIG = {
  open: { label: 'OPEN', color: '#10B981' },
  full: { label: 'FULL', color: '#EF4444' },
  in_progress: { label: 'IN PROGRESS', color: '#F59E0B' },
  completed: { label: 'COMPLETED', color: '#6B7280' },
  cancelled: { label: 'CANCELLED', color: '#9CA3AF' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
