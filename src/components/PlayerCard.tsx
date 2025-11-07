import React from 'react';
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
