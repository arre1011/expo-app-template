/**
 * Session Service
 *
 * This service manages drinking sessions in the application.
 * It uses the sessionCalculator for pure session boundary calculations
 * and coordinates with repositories for persistence.
 *
 * ARCHITECTURE:
 * - sessionCalculator.ts: Pure functions for calculating sessions (no DB)
 * - sessionService.ts: Orchestration layer (this file)
 * - sessionRepository.ts: Database operations
 *
 * KEY PRINCIPLE: "Recalculate All Sessions"
 * When drinks change, we recalculate ALL sessions from scratch.
 * This guarantees consistency and handles all edge cases automatically.
 */

import {
  DrinkEntry,
  UserProfile,
  Session,
  SessionWithDrinks,
} from '../models/types';
import { calculateSessionsFromDrinks, SessionBoundary } from './sessionCalculator';
import * as sessionRepository from '../../data/repositories/sessionRepository';
import * as drinkEntryRepository from '../../data/repositories/drinkEntryRepository';

// Re-export SessionBoundary for convenience
export type { SessionBoundary };

// Re-export calculateSessionBoundaries for backwards compatibility
// (used in existing tests)
export { calculateSessionsFromDrinks as calculateSessionBoundaries } from './sessionCalculator';

// ============================================================================
// MAIN SESSION MANAGEMENT
// ============================================================================

/**
 * Recalculate and sync all sessions based on current drinks.
 *
 * This is the main entry point for session management.
 * Call this after any drink change (add, edit, delete).
 *
 * ALGORITHM:
 * 1. Get all drinks from database
 * 2. Calculate session boundaries using pure function
 * 3. Sync sessions to database
 *
 * This approach:
 * - Guarantees consistency (same drinks = same sessions)
 * - Handles all edge cases (retroactive drinks, overlaps, etc.)
 * - Is simple to understand and maintain
 *
 * @param profile - User profile for BAC calculations
 */
export async function recalculateAllSessions(profile: UserProfile): Promise<void> {
  // STEP 1: Get all drinks
  const allDrinks = await drinkEntryRepository.getAllDrinkEntries();

  if (allDrinks.length === 0) {
    // No drinks → delete all sessions
    await sessionRepository.deleteAllSessions();
    return;
  }

  // STEP 2: Calculate session boundaries
  const boundaries = calculateSessionsFromDrinks(allDrinks, profile);

  // STEP 3: Sync to database
  await sessionRepository.syncSessionsFromBoundaries(boundaries);
}

/**
 * Process a new drink: save and recalculate sessions.
 *
 * @param drink - The new drink (must already be saved to DB with an ID)
 * @param profile - User profile for BAC calculations
 * @returns The session that contains this drink
 */
export async function processNewDrink(
  drink: DrinkEntry,
  profile: UserProfile
): Promise<Session> {
  // Recalculate all sessions
  await recalculateAllSessions(profile);

  // Find and return the session containing this drink
  const session = await findSessionForDrink(drink.id);
  if (!session) {
    throw new Error(`No session found for drink ${drink.id} after recalculation`);
  }

  return session;
}

/**
 * Process drink deletion: recalculate sessions.
 *
 * Note: The drink should already be deleted from the database
 * before calling this function.
 *
 * @param profile - User profile for BAC calculations
 */
export async function processDrinkDeletion(
  _drinkId: number,
  profile: UserProfile
): Promise<void> {
  // Simply recalculate all sessions
  await recalculateAllSessions(profile);
}

/**
 * Process drink edit: recalculate sessions.
 *
 * Note: The drink should already be updated in the database
 * before calling this function.
 *
 * @param profile - User profile for BAC calculations
 */
export async function processDrinkEdit(
  _drinkId: number,
  _oldTimestamp: string,
  _newTimestamp: string,
  profile: UserProfile
): Promise<void> {
  // Simply recalculate all sessions
  await recalculateAllSessions(profile);
}

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Find the session that contains a specific drink.
 *
 * @param drinkId - The drink ID to find
 * @returns The session containing the drink, or null
 */
async function findSessionForDrink(drinkId: number): Promise<Session | null> {
  const drink = await drinkEntryRepository.getDrinkEntryById(drinkId);
  if (!drink || !drink.sessionId) {
    return null;
  }

  return sessionRepository.getSessionById(drink.sessionId);
}

/**
 * Get the active session (if any).
 * An active session has endTime > now.
 */
export async function getActiveSession(): Promise<SessionWithDrinks | null> {
  return sessionRepository.getActiveSession();
}

/**
 * Get the most recent session.
 */
export async function getMostRecentSession(): Promise<Session | null> {
  return sessionRepository.getMostRecentSession();
}

/**
 * Migrate existing drinks without sessions (after schema migration).
 * This is called when upgrading from a version without sessions.
 *
 * @param profile - User profile for BAC calculations
 */
export async function migrateExistingDrinksToSessions(
  profile: UserProfile
): Promise<void> {
  // Check if there are any drinks without sessions
  const drinksWithoutSession = await drinkEntryRepository.getDrinksWithoutSession();

  if (drinksWithoutSession.length === 0) {
    return;
  }

  // Recalculate all sessions - this will assign sessions to all drinks
  await recalculateAllSessions(profile);
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use recalculateAllSessions instead.
 * This function is kept for backwards compatibility.
 */
export async function determineActionForNewDrink(
  _drinkTimestamp: Date,
  _profile: UserProfile
): Promise<{ type: 'recalculate_all' }> {
  // The new approach always recalculates all sessions
  return { type: 'recalculate_all' };
}
