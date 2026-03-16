/**
 * Award Service - Orchestration Layer for Awards System
 *
 * Coordinates between:
 * - awardCalculator (pure calculation functions)
 * - awardRepository (database operations)
 * - drinkDataEvents (event notifications)
 *
 * Main responsibilities:
 * - Recalculate awards when sessions change
 * - Detect new milestones
 * - Update persistent storage
 * - Emit events for UI updates
 */

import { AwardId, AwardState, CalculatedStreak, AwardMilestone } from '../models/types';
import { calculateAllAwards } from './awardCalculator';
import {
  AWARD_MILESTONES,
  PHASE2_AWARDS,
  getNextMilestone,
  calculateProgressPercent,
  getCurrentTier,
} from '../constants/awardDefinitions';
import * as awardRepository from '../../data/repositories/awardRepository';
import * as sessionRepository from '../../data/repositories/sessionRepository';
import * as dailyGoalRepository from '../../data/repositories/dailyGoalRepository';
import { drinkDataEvents } from '../../ui/hooks/drinkDataEvents';

// ============================================================================
// Types
// ============================================================================

export interface RecalculationResult {
  awards: Record<AwardId, AwardState>;
  newMilestones: AwardMilestone[];
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Recalculate all awards and update database.
 *
 * Called when:
 * - App starts
 * - Sessions change (drink added/edited/deleted)
 *
 * @returns Updated award states and any new milestones achieved
 */
export async function recalculateAllAwards(): Promise<RecalculationResult> {
  // Step 1: Load source data
  const [sessions, goals] = await Promise.all([
    sessionRepository.getAllSessions(),
    dailyGoalRepository.getAllDailyGoals(),
  ]);

  // Step 2: Calculate current streaks using pure function
  const calculatedStreaks = calculateAllAwards(sessions, goals);

  // Step 3: Process each active award
  const awards: Record<string, AwardState> = {};
  const newMilestones: AwardMilestone[] = [];

  for (const awardId of PHASE2_AWARDS) {
    const calculated = calculatedStreaks[awardId];

    // Get or create award progress
    const progress = await awardRepository.getAwardProgress(awardId);

    // Calculate new best streak:
    // - If calculator provides bestStreak (e.g., limit_keeper scans all history), use it
    // - Otherwise, compare stored best with current streak
    const newBestStreak = calculated.bestStreak !== undefined
      ? calculated.bestStreak
      : Math.max(progress?.bestStreak ?? 0, calculated.currentStreak);

    // Update progress in database
    await awardRepository.upsertAwardProgress(awardId, {
      bestStreak: newBestStreak,
      totalCount: calculated.currentStreak,
    });

    // Check for new milestones
    const existingMilestones = await awardRepository.getMilestonesForAward(awardId);
    const existingValues = new Set(existingMilestones.map(m => m.milestoneValue));

    for (const milestoneValue of calculated.milestonesReached) {
      if (!existingValues.has(milestoneValue)) {
        // New milestone achieved!
        const milestone = await awardRepository.createMilestone(awardId, milestoneValue);
        newMilestones.push(milestone);
      }
    }

    // Get all milestones for this award (including newly created)
    const allMilestones = await awardRepository.getMilestonesForAward(awardId);

    // Build award state for UI
    awards[awardId] = {
      awardId,
      currentStreak: calculated.currentStreak,
      bestStreak: newBestStreak,
      progressPercent: calculateProgressPercent(awardId, calculated.currentStreak),
      nextMilestoneValue: getNextMilestone(awardId, calculated.currentStreak),
      achievedMilestones: allMilestones,
      currentTier: getCurrentTier(awardId, calculated.currentStreak),
    };
  }

  // Fill in inactive awards with defaults
  for (const awardId of Object.keys(AWARD_MILESTONES) as AwardId[]) {
    if (!awards[awardId]) {
      awards[awardId] = {
        awardId,
        currentStreak: 0,
        bestStreak: 0,
        progressPercent: 0,
        nextMilestoneValue: AWARD_MILESTONES[awardId][0],
        achievedMilestones: [],
        currentTier: null,
      };
    }
  }

  // Step 4: Emit event if there are new milestones
  if (newMilestones.length > 0) {
    drinkDataEvents.notifyAwardsChanged();
  }

  return {
    awards: awards as Record<AwardId, AwardState>,
    newMilestones,
  };
}

/**
 * Get current award states without recalculating.
 * Uses cached data from database.
 */
export async function getAwardStates(): Promise<Record<AwardId, AwardState>> {
  // Load source data for streak calculation
  const [sessions, goals] = await Promise.all([
    sessionRepository.getAllSessions(),
    dailyGoalRepository.getAllDailyGoals(),
  ]);

  // Calculate current streaks
  const calculatedStreaks = calculateAllAwards(sessions, goals);

  const awards: Record<string, AwardState> = {};

  for (const awardId of PHASE2_AWARDS) {
    const calculated = calculatedStreaks[awardId];
    const progress = await awardRepository.getAwardProgress(awardId);
    const milestones = await awardRepository.getMilestonesForAward(awardId);

    awards[awardId] = {
      awardId,
      currentStreak: calculated.currentStreak,
      bestStreak: progress?.bestStreak ?? 0,
      progressPercent: calculateProgressPercent(awardId, calculated.currentStreak),
      nextMilestoneValue: getNextMilestone(awardId, calculated.currentStreak),
      achievedMilestones: milestones,
      currentTier: getCurrentTier(awardId, calculated.currentStreak),
    };
  }

  // Fill in inactive awards with defaults
  for (const awardId of Object.keys(AWARD_MILESTONES) as AwardId[]) {
    if (!awards[awardId]) {
      awards[awardId] = {
        awardId,
        currentStreak: 0,
        bestStreak: 0,
        progressPercent: 0,
        nextMilestoneValue: AWARD_MILESTONES[awardId][0],
        achievedMilestones: [],
        currentTier: null,
      };
    }
  }

  return awards as Record<AwardId, AwardState>;
}

/**
 * Get a single award state
 */
export async function getAwardState(awardId: AwardId): Promise<AwardState> {
  const allStates = await getAwardStates();
  return allStates[awardId];
}

/**
 * Get the most recently achieved milestone (for widget display)
 */
export async function getMostRecentMilestone(): Promise<AwardMilestone | null> {
  return awardRepository.getMostRecentMilestone();
}

/**
 * Get uncelebrated milestones (for celebration modal)
 */
export async function getUncelebratedMilestones(): Promise<AwardMilestone[]> {
  return awardRepository.getUncelebratedMilestones();
}

/**
 * Mark a milestone as celebrated
 */
export async function markMilestoneCelebrated(milestoneId: number): Promise<void> {
  await awardRepository.markMilestoneCelebrated(milestoneId);
}

/**
 * Mark all milestones for an award as celebrated
 */
export async function markAllMilestonesCelebrated(awardId: AwardId): Promise<void> {
  await awardRepository.markAllMilestonesCelebrated(awardId);
}

/**
 * Handle session changes - called by event listener
 */
export async function onSessionsChanged(): Promise<RecalculationResult> {
  return recalculateAllAwards();
}
