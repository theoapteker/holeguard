/**
 * Game-specific types for the application
 *
 * Extends the base database types with application-specific types
 */

import type { Game, Profile, GameParticipant } from './database.types';

/**
 * Game with creator details
 */
export interface GameWithCreator extends Game {
  creator: Profile;
}

/**
 * Game with full participant details
 */
export interface GameWithDetails extends Game {
  creator: Profile;
  participants: Array<GameParticipant & { player: Profile }>;
  confirmed_count: number;
}

/**
 * Participant with player profile
 */
export interface ParticipantWithPlayer extends GameParticipant {
  player: Profile;
}
