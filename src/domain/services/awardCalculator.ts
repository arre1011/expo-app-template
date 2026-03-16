/**
 * Award Calculator - Pure Functions for Award/Streak Calculation
 *
 * This module provides pure functions to calculate award streaks from sessions and goals.
 * No side effects, no database access - only pure calculations.
 *
 * KEY PRINCIPLE: Awards are DERIVED DATA (like Sessions).
 * The source of truth is Sessions + DailyGoals - awards are calculated from them.
 *
 * Phase 2: All award types implemented.
 */

import {
  format,
  subDays,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import { Session, DailyGoal, AwardId, CalculatedStreak } from '../models/types';
import { DEFAULT_DAILY_GOAL } from '../constants/defaults';
import { AWARD_MILESTONES, PHASE2_AWARDS } from '../constants/awardDefinitions';

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate all active award streaks from sessions and goals.
 *
 * @param sessions - All sessions from DB
 * @param goals - All daily goals from DB
 * @returns Map of award ID to calculated streak data
 */
export function calculateAllAwards(
  sessions: Session[],
  goals: DailyGoal[]
): Record<AwardId, CalculatedStreak> {
  const result: Partial<Record<AwardId, CalculatedStreak>> = {};

  // Pre-compute shared data structures
  const sessionsByDate = groupSessionsByDate(sessions);
  const goalsByDate = new Map<string, DailyGoal>();
  for (const goal of goals) {
    goalsByDate.set(goal.date, goal);
  }

  // Calculate all Phase 2 awards (streak awards only)
  for (const awardId of PHASE2_AWARDS) {
    switch (awardId) {
      case 'limit_keeper':
        result[awardId] = calculateLimitKeeperStreak(sessions, goals);
        break;
      case 'mindful_drinker':
        result[awardId] = calculateMindfulDrinkerStreak(sessions, goals);
        break;
    }
  }

  // Fill in defaults for any missing awards
  for (const awardId of Object.keys(AWARD_MILESTONES) as AwardId[]) {
    if (!result[awardId]) {
      result[awardId] = {
        awardId,
        currentStreak: 0,
        milestonesReached: [],
      };
    }
  }

  return result as Record<AwardId, CalculatedStreak>;
}

/**
 * Calculate "Limit Keeper" streak: consecutive days under BAC limit.
 *
 * LOGIC:
 * - Start from today, go backwards day by day
 * - For each day, check if ALL sessions that started on that day are under limit
 * - A sober day (no sessions) counts as "under limit"
 * - The streak breaks when a day has ANY session over the limit
 * - IMPORTANT: Only count days since the first tracked session (can't measure before tracking started)
 * - IMPORTANT: Also calculate historical best streak by scanning ALL data
 *
 * @param sessions - All sessions sorted by start time
 * @param goals - All daily goals
 * @returns Calculated streak data including historical best
 */
export function calculateLimitKeeperStreak(
  sessions: Session[],
  goals: DailyGoal[]
): CalculatedStreak {
  // If no sessions exist, we can't measure anything yet
  if (sessions.length === 0) {
    return {
      awardId: 'limit_keeper',
      currentStreak: 0,
      bestStreak: 0,
      milestonesReached: [],
    };
  }

  // Group sessions by their start date
  const sessionsByDate = groupSessionsByDate(sessions);

  // Create a map of goals by date for quick lookup
  const goalsByDate = new Map<string, DailyGoal>();
  for (const goal of goals) {
    goalsByDate.set(goal.date, goal);
  }

  // Find the earliest session date (when tracking started)
  const earliestSessionDate = sessions
    .map(s => startOfDay(new Date(s.startTime)))
    .reduce((earliest, date) => (date < earliest ? date : earliest));

  const today = startOfDay(new Date());
  const totalDays = differenceInDays(today, earliestSessionDate) + 1;

  // Scan ALL days from earliest to today to find:
  // 1. Current streak (consecutive days from today backwards)
  // 2. Historical best streak (longest consecutive run ever)
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Scan from earliest date to today
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const checkDate = subDays(today, totalDays - 1 - dayIndex);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    const isUnderLimit = isDayUnderLimit(dateStr, sessionsByDate, goalsByDate);

    if (isUnderLimit) {
      tempStreak++;
      // Update best if this streak is longer
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    } else {
      // Streak broken, reset temp counter
      tempStreak = 0;
    }
  }

  // Current streak: count from today backwards
  for (let daysBack = 0; daysBack < totalDays; daysBack++) {
    const checkDate = subDays(today, daysBack);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    if (isDayUnderLimit(dateStr, sessionsByDate, goalsByDate)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Determine which milestones are reached (based on best streak for historical achievements)
  const milestones = AWARD_MILESTONES.limit_keeper;
  const milestonesReached = milestones.filter(m => bestStreak >= m);

  return {
    awardId: 'limit_keeper',
    currentStreak,
    bestStreak,
    milestonesReached,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Group sessions by their start date (YYYY-MM-DD format).
 */
function groupSessionsByDate(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();

  for (const session of sessions) {
    const dateStr = format(new Date(session.startTime), 'yyyy-MM-dd');
    if (!map.has(dateStr)) {
      map.set(dateStr, []);
    }
    map.get(dateStr)!.push(session);
  }

  return map;
}

/**
 * Check if a specific day is "under limit".
 *
 * A day is under limit if:
 * 1. No sessions on that day (sober day) → under limit
 * 2. All sessions on that day have peakBAC <= goal.maxBAC
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @param sessionsByDate - Map of sessions grouped by date
 * @param goalsByDate - Map of goals by date
 * @returns true if day is under limit, false if over limit
 */
export function isDayUnderLimit(
  dateStr: string,
  sessionsByDate: Map<string, Session[]>,
  goalsByDate: Map<string, DailyGoal>
): boolean {
  const daySessions = sessionsByDate.get(dateStr) || [];

  // No sessions = sober day = under limit
  if (daySessions.length === 0) {
    return true;
  }

  // Get the goal for this day (or default)
  const goal = goalsByDate.get(dateStr);
  const maxBAC = goal?.maxBAC ?? DEFAULT_DAILY_GOAL.maxBAC;

  // Check if ALL sessions are under or equal to the limit
  // Note: Using <= because reaching exactly the limit is OK
  for (const session of daySessions) {
    if (session.peakBAC > maxBAC) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a single session is under the limit for its day.
 *
 * @param session - The session to check
 * @param goals - All daily goals (will find the matching one)
 * @returns true if session is under limit
 */
export function isSessionUnderLimit(
  session: Session,
  goals: DailyGoal[]
): boolean {
  const dateStr = format(new Date(session.startTime), 'yyyy-MM-dd');
  const goal = goals.find(g => g.date === dateStr);
  const maxBAC = goal?.maxBAC ?? DEFAULT_DAILY_GOAL.maxBAC;

  return session.peakBAC <= maxBAC;
}

/**
 * Get peak BAC for a specific day.
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @param sessions - All sessions
 * @returns Peak BAC for the day, or 0 if no sessions
 */
export function getDayPeakBAC(dateStr: string, sessions: Session[]): number {
  const daySessions = sessions.filter(s =>
    format(new Date(s.startTime), 'yyyy-MM-dd') === dateStr
  );

  if (daySessions.length === 0) {
    return 0;
  }

  return Math.max(...daySessions.map(s => s.peakBAC));
}

// ============================================================================
// PHASE 2 AWARD CALCULATIONS
// ============================================================================

/**
 * Calculate "Mindful Drinker" streak: consecutive drinking sessions under limit.
 *
 * LOGIC:
 * - Sort sessions by start time (newest first)
 * - Count consecutive sessions that are under limit
 * - Stop counting when a session exceeds the limit
 *
 * @param sessions - All sessions
 * @param goals - All daily goals
 * @returns Calculated streak data
 */
export function calculateMindfulDrinkerStreak(
  sessions: Session[],
  goals: DailyGoal[]
): CalculatedStreak {
  if (sessions.length === 0) {
    return {
      awardId: 'mindful_drinker',
      currentStreak: 0,
      milestonesReached: [],
    };
  }

  // Sort sessions by start time, newest first
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  let streak = 0;

  for (const session of sortedSessions) {
    if (isSessionUnderLimit(session, goals)) {
      streak++;
    } else {
      break;
    }
  }

  const milestones = AWARD_MILESTONES.mindful_drinker;
  const milestonesReached = milestones.filter(m => streak >= m);

  return {
    awardId: 'mindful_drinker',
    currentStreak: streak,
    milestonesReached,
  };
}


