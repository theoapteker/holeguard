import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SkillLevel } from '../types';

interface SkillBadgeProps {
  level: SkillLevel;
}

const SKILL_COLORS = {
  beginner: '#10B981',
  intermediate: '#3B82F6',
  advanced: '#F59E0B',
  expert: '#EF4444',
};

export default function SkillBadge({ level }: SkillBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: SKILL_COLORS[level] }]}>
      <Text style={styles.text}>{level.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
