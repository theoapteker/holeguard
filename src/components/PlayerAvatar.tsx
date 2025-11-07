import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { getInitials } from '../utils/formatters';

interface PlayerAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: number;
}

/**
 * PlayerAvatar Component
 *
 * Displays a user's avatar image or initials fallback
 *
 * @param avatarUrl - URL to the avatar image
 * @param name - User's full name (used for initials fallback)
 * @param size - Avatar size in pixels (default: 40)
 */
export function PlayerAvatar({ avatarUrl, name, size = 40 }: PlayerAvatarProps) {
  const initials = getInitials(name);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#E0E0E0',
  },
  fallback: {
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
