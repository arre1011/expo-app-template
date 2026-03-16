/**
 * Limit Warning Service
 *
 * Centralized logic for determining when and what type of warning to show
 * when a user is approaching or exceeding their BAC limit.
 *
 * Strategies:
 * 1. Pre-drink warning: This drink would exceed the limit
 * 2. Predictive warning: If you drink the same again soon, you'll exceed
 * 3. Approaching limit: You're at 80%+ of your limit (visual indicator only)
 */

import { DrinkEntry, UserProfile, DailyGoal, CreateDrinkEntry } from '../models/types';
import {
  calculateAlcoholGrams,
  calculateBACTimeSeries,
  getBACAtTime,
  calculateBACIncrease,
} from './bacCalculator';

// ============================================================================
// Types
// ============================================================================

export type WarningType =
  | 'none'                    // No warning needed
  | 'approaching_limit'       // 80% threshold (visual indicator only)
  | 'will_exceed_limit'       // This drink would exceed the limit
  | 'predictive_warning';     // If you drink the same again soon, you'll exceed

export interface LimitWarningResult {
  type: WarningType;

  // Calculated values for display
  currentBAC: number;
  projectedBAC: number;           // BAC after this drink
  predictedNextDrinkBAC: number | null;  // BAC if same drink again after duration

  // Context info for the message
  percentOfLimit: number;         // e.g., 85 (as percentage)
  limitValue: number;             // The actual limit (e.g., 0.5)
  estimatedDrinkDurationMinutes: number;

  // Whether the drink can be saved (always true - harm reduction principle)
  canProceed: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Minutes to drink per gram of alcohol
 *
 * Examples:
 * - Beer (500ml, 5%) = ~20g alcohol → 20 * 1.5 = 30 min
 * - Wine (150ml, 12%) = ~14g alcohol → 14 * 1.5 = 21 min
 * - Shot (40ml, 40%) = ~13g alcohol → 13 * 1.5 = 19 min
 */
const MINUTES_PER_GRAM_ALCOHOL = 1.5;

/**
 * Minimum drink duration in minutes (for very small drinks)
 */
const MIN_DRINK_DURATION_MINUTES = 5;

/**
 * Maximum drink duration in minutes (cap for very large drinks)
 */
const MAX_DRINK_DURATION_MINUTES = 60;

/**
 * Threshold for "approaching limit" warning (as decimal, 0.8 = 80%)
 */
const APPROACHING_LIMIT_THRESHOLD = 0.8;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimate how long it takes to drink a beverage based on alcohol content
 * Formula: alcoholGrams * MINUTES_PER_GRAM_ALCOHOL
 */
export function estimateDrinkDurationMinutes(volumeMl: number, abvPercent: number): number {
  const alcoholGrams = calculateAlcoholGrams(volumeMl, abvPercent);
  const duration = alcoholGrams * MINUTES_PER_GRAM_ALCOHOL;

  // Clamp to reasonable bounds
  return Math.max(MIN_DRINK_DURATION_MINUTES, Math.min(MAX_DRINK_DURATION_MINUTES, Math.round(duration)));
}

/**
 * Calculate projected peak BAC if a new drink is added
 */
function calculateProjectedPeakBAC(
  existingDrinks: DrinkEntry[],
  newDrink: CreateDrinkEntry,
  profile: UserProfile
): number {
  // Create a temporary drink entry for calculation
  const tempDrink: DrinkEntry = {
    id: 0,
    timestamp: newDrink.timestamp,
    type: newDrink.type,
    volumeMl: newDrink.volumeMl,
    abvPercent: newDrink.abvPercent,
    label: newDrink.label || null,
    notes: newDrink.notes || null,
    sessionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allDrinks = [...existingDrinks, tempDrink];
  const timeSeries = calculateBACTimeSeries(allDrinks, profile);

  return timeSeries.peakBAC;
}

/**
 * Calculate BAC if the same drink is consumed again after the estimated drink duration
 */
function calculatePredictedNextDrinkBAC(
  existingDrinks: DrinkEntry[],
  currentDrink: CreateDrinkEntry,
  profile: UserProfile,
  drinkDurationMinutes: number
): number {
  // First, add the current drink
  const currentDrinkEntry: DrinkEntry = {
    id: 0,
    timestamp: currentDrink.timestamp,
    type: currentDrink.type,
    volumeMl: currentDrink.volumeMl,
    abvPercent: currentDrink.abvPercent,
    label: currentDrink.label || null,
    notes: currentDrink.notes || null,
    sessionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Calculate when the next drink would be (current drink time + duration)
  const currentDrinkTime = new Date(currentDrink.timestamp);
  const nextDrinkTime = new Date(currentDrinkTime.getTime() + drinkDurationMinutes * 60 * 1000);

  // Create a hypothetical "next drink" (same as current)
  const nextDrinkEntry: DrinkEntry = {
    ...currentDrinkEntry,
    id: 1,
    timestamp: nextDrinkTime.toISOString(),
  };

  // Calculate BAC with all drinks including the hypothetical next one
  const allDrinks = [...existingDrinks, currentDrinkEntry, nextDrinkEntry];
  const timeSeries = calculateBACTimeSeries(allDrinks, profile);

  return timeSeries.peakBAC;
}

// ============================================================================
// Main Service Function
// ============================================================================

/**
 * Evaluate what type of limit warning (if any) should be shown
 *
 * Strategy priority:
 * 1. will_exceed_limit - This drink would exceed (highest priority)
 * 2. predictive_warning - Next same drink would exceed
 * 3. approaching_limit - At 80%+ of limit (lowest priority, visual only)
 */
export function evaluateLimitWarning(
  existingDrinks: DrinkEntry[],
  goal: DailyGoal | null,
  profile: UserProfile,
  pendingDrink: CreateDrinkEntry
): LimitWarningResult {
  // If no goal or goal disabled, no warnings
  if (!goal || !goal.enabled) {
    return {
      type: 'none',
      currentBAC: 0,
      projectedBAC: 0,
      predictedNextDrinkBAC: null,
      percentOfLimit: 0,
      limitValue: 0,
      estimatedDrinkDurationMinutes: 0,
      canProceed: true,
    };
  }

  const limit = goal.maxBAC;

  // Calculate current peak BAC (without the new drink)
  let currentBAC = 0;
  if (existingDrinks.length > 0) {
    const timeSeries = calculateBACTimeSeries(existingDrinks, profile);
    currentBAC = timeSeries.peakBAC;
  }

  // Calculate projected peak BAC (with the new drink)
  const projectedBAC = calculateProjectedPeakBAC(existingDrinks, pendingDrink, profile);

  // Estimate drink duration
  const drinkDurationMinutes = estimateDrinkDurationMinutes(
    pendingDrink.volumeMl,
    pendingDrink.abvPercent
  );

  // Calculate predicted BAC if same drink again
  const predictedNextDrinkBAC = calculatePredictedNextDrinkBAC(
    existingDrinks,
    pendingDrink,
    profile,
    drinkDurationMinutes
  );

  // Calculate percentage of limit
  const percentOfLimit = limit > 0 ? Math.round((projectedBAC / limit) * 100) : 0;

  // Base result
  const baseResult: LimitWarningResult = {
    type: 'none',
    currentBAC,
    projectedBAC,
    predictedNextDrinkBAC,
    percentOfLimit,
    limitValue: limit,
    estimatedDrinkDurationMinutes: drinkDurationMinutes,
    canProceed: true, // Always true - harm reduction principle
  };

  // Strategy 1: Check if this drink would exceed the limit
  // Use small margin (0.01) to avoid floating point issues
  if (projectedBAC >= limit - 0.01) {
    return {
      ...baseResult,
      type: 'will_exceed_limit',
    };
  }

  // Strategy 2: Check if drinking the same again would exceed
  if (predictedNextDrinkBAC >= limit - 0.01) {
    return {
      ...baseResult,
      type: 'predictive_warning',
    };
  }

  // Strategy 3: Check if approaching limit (80%+)
  if (projectedBAC >= limit * APPROACHING_LIMIT_THRESHOLD) {
    return {
      ...baseResult,
      type: 'approaching_limit',
    };
  }

  // No warning needed
  return baseResult;
}

/**
 * Format BAC value for display in warning messages
 */
export function formatBACForWarning(bac: number): string {
  return bac.toFixed(2).replace('.', ',') + '‰';
}
