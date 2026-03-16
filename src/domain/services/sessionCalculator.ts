/**
 * Session Calculator - Pure Functions for Session Boundary Calculation
 *
 * This module provides pure functions to calculate session boundaries from drinks.
 * It uses the classic "Merge Overlapping Intervals" algorithm from computer science.
 *
 * KEY PRINCIPLE: Sessions are DERIVED DATA, not source data.
 * The source of truth is the list of drinks - sessions are calculated from them.
 *
 * ALGORITHM:
 * 1. Sort all drinks by timestamp
 * 2. For each drink, calculate its individual "sober interval" [drinkTime, soberTime]
 * 3. Merge overlapping intervals using the standard interval-merge algorithm
 * 4. For each merged group, calculate full session data (peak BAC, etc.)
 *
 * This approach:
 * - Is simple and easy to test (pure functions, no DB dependencies)
 * - Handles all edge cases automatically (retroactive drinks, overlaps, gaps)
 * - Guarantees consistency (same inputs = same outputs)
 * - Requires no recursion (single pass through sorted intervals)
 *
 * @see https://leetcode.com/problems/merge-intervals/ - The classic problem
 * @see https://www.geeksforgeeks.org/dsa/merging-intervals/ - Algorithm explanation
 */

import { DrinkEntry, UserProfile } from '../models/types';
import {
  calculateBACTimeSeries,
  calculateTotalStandardUnits,
} from './bacCalculator';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a calculated session boundary with all relevant data.
 * This is the output of the session calculation.
 */
export interface SessionBoundary {
  /** When the session started (first drink timestamp) */
  startTime: Date;
  /** When BAC returns to 0 (calculated sober time) */
  endTime: Date;
  /** Highest BAC reached during the session */
  peakBAC: number;
  /** When the peak BAC was reached */
  peakTime: Date;
  /** Total standard units consumed in this session */
  totalStandardUnits: number;
  /** All drinks that belong to this session */
  drinks: DrinkEntry[];
}

/**
 * Internal representation of a drink's time interval.
 * Used during the merge algorithm.
 */
interface DrinkInterval {
  /** The drink this interval represents */
  drink: DrinkEntry;
  /** When the drink was consumed */
  start: Date;
  /** When BAC from this drink alone would reach 0 */
  end: Date;
}

// ============================================================================
// MAIN ALGORITHM
// ============================================================================

/**
 * Calculate all session boundaries from a list of drinks.
 *
 * This is the main entry point for session calculation.
 * It takes all drinks and a user profile, and returns a list of non-overlapping
 * sessions that cover all the drinks.
 *
 * ALGORITHM (Merge Overlapping Intervals):
 * 1. Sort drinks by timestamp
 * 2. Calculate individual sober time for each drink
 * 3. Iterate through sorted drinks:
 *    - If no overlap with current session: start new session
 *    - If overlap: add drink to current session, recalculate end time
 * 4. Return all sessions with full calculated data
 *
 * TIME COMPLEXITY: O(n log n) for sorting + O(n) for merging = O(n log n)
 * SPACE COMPLEXITY: O(n) for storing sessions
 *
 * @param drinks - All drinks to process (order doesn't matter, will be sorted)
 * @param profile - User profile for BAC calculations
 * @returns Array of session boundaries, sorted by start time (oldest first)
 *
 * @example
 * // Drinks at 13:00 and 14:00 that overlap → ONE session
 * const sessions = calculateSessionsFromDrinks([drink1, drink2], profile);
 * // sessions.length === 1
 *
 * @example
 * // Drinks at 10:00 and 18:00 with no overlap → TWO sessions
 * const sessions = calculateSessionsFromDrinks([drink1, drink2], profile);
 * // sessions.length === 2
 */
export function calculateSessionsFromDrinks(
  drinks: DrinkEntry[],
  profile: UserProfile
): SessionBoundary[] {
  // Handle empty input
  if (drinks.length === 0) {
    return [];
  }

  // STEP 1: Sort drinks by timestamp (oldest first)
  // This is crucial for the merge algorithm to work correctly
  const sortedDrinks = [...drinks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // STEP 2: Calculate individual intervals for each drink
  const intervals = calculateDrinkIntervals(sortedDrinks, profile);

  // STEP 3: Merge overlapping intervals
  const mergedGroups = mergeOverlappingIntervals(intervals, profile);

  // STEP 4: Calculate full session data for each merged group
  const sessions = mergedGroups.map(group => calculateSessionFromDrinks(group, profile));

  return sessions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the time interval for each drink.
 *
 * For each drink, we calculate:
 * - start: when the drink was consumed
 * - end: when BAC from this drink ALONE would return to 0
 *
 * Note: The "end" time is for this drink in isolation. When drinks are
 * combined in a session, the actual sober time will be later because
 * BAC contributions add up.
 *
 * @param sortedDrinks - Drinks sorted by timestamp
 * @param profile - User profile for BAC calculation
 * @returns Array of drink intervals
 */
function calculateDrinkIntervals(
  sortedDrinks: DrinkEntry[],
  profile: UserProfile
): DrinkInterval[] {
  return sortedDrinks.map(drink => {
    const drinkTime = new Date(drink.timestamp);

    // Calculate when BAC from this single drink would reach 0
    const timeSeries = calculateBACTimeSeries([drink], profile, drinkTime);
    const soberTime = timeSeries.soberTime;

    // If no sober time calculated (shouldn't happen with valid drink),
    // estimate based on peak BAC
    let endTime: Date;
    if (soberTime) {
      endTime = soberTime;
    } else {
      // Fallback: estimate based on peak BAC and elimination rate
      const hoursToSober = timeSeries.peakBAC / profile.eliminationRatePermillePerHour;
      const peakTime = timeSeries.peakTime || drinkTime;
      endTime = new Date(peakTime.getTime() + hoursToSober * 60 * 60 * 1000);
    }

    return {
      drink,
      start: drinkTime,
      end: endTime,
    };
  });
}

/**
 * Merge overlapping drink intervals into groups.
 *
 * This is the core of the "Merge Overlapping Intervals" algorithm.
 *
 * Two intervals overlap if: interval1.end >= interval2.start
 * (assuming intervals are sorted by start time)
 *
 * IMPORTANT: When intervals overlap, we don't just take max(end1, end2)!
 * We must RECALCULATE the combined sober time because BAC contributions
 * from multiple drinks ADD UP.
 *
 * @param intervals - Drink intervals sorted by start time
 * @param profile - User profile for BAC recalculation
 * @returns Array of drink groups (each group = one session)
 */
function mergeOverlappingIntervals(
  intervals: DrinkInterval[],
  profile: UserProfile
): DrinkEntry[][] {
  if (intervals.length === 0) {
    return [];
  }

  const groups: DrinkEntry[][] = [];

  // Start with the first interval
  let currentGroup: DrinkEntry[] = [intervals[0].drink];
  let currentEnd: Date = intervals[0].end;

  // Process remaining intervals
  for (let i = 1; i < intervals.length; i++) {
    const interval = intervals[i];

    // Check for overlap: does this drink start before the current session ends?
    if (interval.start <= currentEnd) {
      // OVERLAP: Add drink to current group
      currentGroup.push(interval.drink);

      // CRITICAL: Recalculate the combined sober time!
      // The sober time for multiple drinks is NOT max(end1, end2),
      // it must be recalculated because BAC contributions add up.
      currentEnd = calculateCombinedSoberTime(currentGroup, profile);
    } else {
      // NO OVERLAP: Save current group and start a new one
      groups.push(currentGroup);
      currentGroup = [interval.drink];
      currentEnd = interval.end;
    }
  }

  // Don't forget the last group!
  groups.push(currentGroup);

  return groups;
}

/**
 * Calculate the sober time for a group of drinks combined.
 *
 * This is different from max(soberTime1, soberTime2) because
 * BAC contributions from multiple drinks ADD UP, resulting in
 * a later sober time than either drink alone.
 *
 * @param drinks - Group of drinks in a session
 * @param profile - User profile for BAC calculation
 * @returns When BAC will return to 0
 */
function calculateCombinedSoberTime(
  drinks: DrinkEntry[],
  profile: UserProfile
): Date {
  const earliestDrink = drinks.reduce((earliest, drink) => {
    const drinkTime = new Date(drink.timestamp);
    return drinkTime < earliest ? drinkTime : earliest;
  }, new Date(drinks[0].timestamp));

  const timeSeries = calculateBACTimeSeries(drinks, profile, earliestDrink);

  if (timeSeries.soberTime) {
    return timeSeries.soberTime;
  }

  // Fallback: estimate from peak
  const hoursToSober = timeSeries.peakBAC / profile.eliminationRatePermillePerHour;
  const peakTime = timeSeries.peakTime || earliestDrink;
  return new Date(peakTime.getTime() + hoursToSober * 60 * 60 * 1000);
}

/**
 * Calculate full session data for a group of drinks.
 *
 * Takes a group of drinks that belong to the same session and
 * calculates all the session metadata (peak BAC, times, etc.)
 *
 * @param drinks - All drinks in this session
 * @param profile - User profile for BAC calculation
 * @returns Complete session boundary data
 */
function calculateSessionFromDrinks(
  drinks: DrinkEntry[],
  profile: UserProfile
): SessionBoundary {
  // Sort drinks by timestamp (should already be sorted, but be safe)
  const sortedDrinks = [...drinks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate start time (first drink)
  const startTime = new Date(sortedDrinks[0].timestamp);

  // Calculate full time series to get peak and sober time
  const timeSeries = calculateBACTimeSeries(sortedDrinks, profile, startTime);

  // Calculate end time (sober time)
  let endTime: Date;
  if (timeSeries.soberTime) {
    endTime = timeSeries.soberTime;
  } else {
    // Fallback: estimate from peak
    const hoursToSober = timeSeries.peakBAC / profile.eliminationRatePermillePerHour;
    const peakTime = timeSeries.peakTime || startTime;
    endTime = new Date(peakTime.getTime() + hoursToSober * 60 * 60 * 1000);
  }

  // Calculate total standard units
  const totalStandardUnits = calculateTotalStandardUnits(sortedDrinks);

  return {
    startTime,
    endTime,
    peakBAC: timeSeries.peakBAC,
    peakTime: timeSeries.peakTime || startTime,
    totalStandardUnits,
    drinks: sortedDrinks,
  };
}

// ============================================================================
// UTILITY FUNCTIONS FOR TESTING AND DEBUGGING
// ============================================================================

/**
 * Check if two time intervals overlap.
 *
 * Useful for testing and debugging.
 *
 * @param interval1 - First interval [start, end]
 * @param interval2 - Second interval [start, end]
 * @returns true if intervals overlap
 */
export function intervalsOverlap(
  interval1: { start: Date; end: Date },
  interval2: { start: Date; end: Date }
): boolean {
  // Intervals overlap if: start1 <= end2 AND start2 <= end1
  return interval1.start <= interval2.end && interval2.start <= interval1.end;
}

/**
 * Check if a drink's BAC effect overlaps with a session.
 *
 * This is the key question: "Should this drink be added to this session?"
 *
 * @param drink - The drink to check
 * @param session - The session to check against
 * @param profile - User profile for BAC calculation
 * @returns true if the drink should be part of the session
 */
export function drinkOverlapsWithSession(
  drink: DrinkEntry,
  session: SessionBoundary,
  profile: UserProfile
): boolean {
  // Calculate when this drink alone would make you sober
  const drinkTime = new Date(drink.timestamp);
  const timeSeries = calculateBACTimeSeries([drink], profile, drinkTime);
  const drinkSoberTime = timeSeries.soberTime || new Date(
    drinkTime.getTime() + (timeSeries.peakBAC / profile.eliminationRatePermillePerHour) * 60 * 60 * 1000
  );

  // Check overlap
  return intervalsOverlap(
    { start: drinkTime, end: drinkSoberTime },
    { start: session.startTime, end: session.endTime }
  );
}

/**
 * Format a session boundary for debugging/logging.
 *
 * @param session - Session to format
 * @returns Human-readable string representation
 */
export function formatSessionBoundary(session: SessionBoundary): string {
  const formatTime = (d: Date) => d.toISOString().slice(11, 16); // HH:MM
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);  // YYYY-MM-DD

  const startDate = formatDate(session.startTime);
  const endDate = formatDate(session.endTime);
  const sameDay = startDate === endDate;

  const timeRange = sameDay
    ? `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`
    : `${startDate} ${formatTime(session.startTime)} - ${endDate} ${formatTime(session.endTime)}`;

  return `Session [${timeRange}] | Peak: ${session.peakBAC.toFixed(2)}‰ | ${session.drinks.length} drink(s) | ${session.totalStandardUnits.toFixed(1)} SU`;
}
