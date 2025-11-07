import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { SkillLevelType } from '../types/database.types';
import { getSkillLevelColor, getSkillLevelLabel } from '../utils/formatters';

interface SkillBadgeProps {
  skillLevel: SkillLevelType;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showLabel?: boolean;
}

/**
 * SkillBadge Component
 *
 * Displays a colored badge indicating skill level
 *
 * @param skillLevel - The skill level to display
 * @param size - Badge size variant
 * @param style - Additional styles
 * @param showLabel - Show full label or just first letter (default: true)
 */
export function SkillBadge({
  skillLevel,
  size = 'medium',
  style,
  showLabel = true,
}: SkillBadgeProps) {
  const color = getSkillLevelColor(skillLevel);
  const label = showLabel
    ? getSkillLevelLabel(skillLevel)
    : skillLevel.charAt(0).toUpperCase();

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
      <Text style={[styles.text, textSizeStyles[size]]}>{label}</Text>
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
