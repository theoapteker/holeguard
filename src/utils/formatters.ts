/**
 * Utility functions for formatting data
 */

import type { SkillLevelType, GameStatusType } from '../types/database.types';

/**
 * Format a date/time string into a human-readable format
 */
export function formatDateTime(dateTime: string | Date): string {
  if (!dateTime) return '';

  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a date only (no time)
 */
export function formatDate(dateTime: string | Date): string {
  if (!dateTime) return '';

  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time only (no date)
 */
export function formatTime(dateTime: string | Date): string {
  if (!dateTime) return '';

  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get a relative time string (e.g., "in 2 hours", "3 days ago")
 */
export function getRelativeTime(dateTime: string | Date): string {
  if (!dateTime) return '';

  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffSec < 60) {
    return `${prefix}${diffSec} second${diffSec !== 1 ? 's' : ''}${suffix}`;
  } else if (diffMin < 60) {
    return `${prefix}${diffMin} minute${diffMin !== 1 ? 's' : ''}${suffix}`;
  } else if (diffHour < 24) {
    return `${prefix}${diffHour} hour${diffHour !== 1 ? 's' : ''}${suffix}`;
  } else {
    return `${prefix}${diffDay} day${diffDay !== 1 ? 's' : ''}${suffix}`;
  }
}

/**
 * Get the color associated with a skill level
 */
export function getSkillLevelColor(skillLevel: SkillLevelType | null): string {
  switch (skillLevel) {
    case 'beginner':
      return '#4CAF50'; // Green
    case 'intermediate':
      return '#2196F3'; // Blue
    case 'advanced':
      return '#FF9800'; // Orange
    case 'pro':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray
  }
}

/**
 * Get the color associated with a game status
 */
export function getStatusColor(status: GameStatusType): string {
  switch (status) {
    case 'open':
      return '#4CAF50'; // Green
    case 'full':
      return '#FF9800'; // Orange
    case 'completed':
      return '#9E9E9E'; // Gray
    case 'cancelled':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray
  }
}

/**
 * Get a display label for skill level
 */
export function getSkillLevelLabel(skillLevel: SkillLevelType): string {
  return skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1);
}

/**
 * Get a display label for game status
 */
export function getStatusLabel(status: GameStatusType): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Format player count (e.g., "8/12 players")
 */
export function formatPlayerCount(current: number, max: number): string {
  return `${current}/${max} player${max !== 1 ? 's' : ''}`;
}

/**
 * Get initials from a name (for avatar placeholders)
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}
