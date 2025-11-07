import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { GameStatusType } from '../types/database.types';
import { getStatusColor, getStatusLabel } from '../utils/formatters';

interface StatusBadgeProps {
  status: GameStatusType;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

/**
 * StatusBadge Component
 *
 * Displays a colored badge indicating game status
 *
 * @param status - The game status to display
 * @param size - Badge size variant
 * @param style - Additional styles
 */
export function StatusBadge({ status, size = 'medium', style }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const textSizeStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  };

  return (
    <View style={[styles.badge, sizeStyles[size], { backgroundColor: color }, style]}>
      <Text style={[styles.text, textSizeStyles[size]]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});
