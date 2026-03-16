import { DrinkEntry, DailyGoal, UserProfile, DailyStats, PeriodStats, DayStatus, Session } from '../models/types';
import { calculateBACTimeSeries, calculateAlcoholGrams } from './bacCalculator';
import { startOfDay, endOfDay, eachDayOfInterval, format, isWithinInterval, parseISO } from 'date-fns';
import { DEFAULT_DAILY_GOAL } from '../constants/defaults';

/**
 * Get drinks for a specific day
 */
export function getDrinksForDay(drinks: DrinkEntry[], date: Date): DrinkEntry[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp);
    return isWithinInterval(drinkDate, { start: dayStart, end: dayEnd });
  });
}

/**
 * Get drinks for a date range
 */
export function getDrinksForPeriod(
  drinks: DrinkEntry[],
  startDate: Date,
  endDate: Date
): DrinkEntry[] {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  return drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp);
    return isWithinInterval(drinkDate, { start, end });
  });
}

/**
 * Calculate statistics for a single day
 */
export function calculateDailyStats(
  drinks: DrinkEntry[],
  goal: DailyGoal | null,
  profile: UserProfile,
  date: Date
): DailyStats {
  const dayDrinks = getDrinksForDay(drinks, date);
  const drinkCount = dayDrinks.length;

  const totalAlcoholGrams = dayDrinks.reduce(
    (sum, drink) => sum + calculateAlcoholGrams(drink.volumeMl, drink.abvPercent),
    0
  );

  // Calculate peak BAC for the day
  let peakBAC = 0;
  if (dayDrinks.length > 0) {
    const timeSeries = calculateBACTimeSeries(dayDrinks, profile);
    peakBAC = timeSeries.peakBAC;
  }

  // Determine if within goal (BAC limit only)
  let withinGoal: boolean | null = null;
  if (goal && goal.enabled) {
    withinGoal = peakBAC <= goal.maxBAC;
  }

  return {
    date: format(date, 'yyyy-MM-dd'),
    drinkCount,
    totalAlcoholGrams: Math.round(totalAlcoholGrams * 10) / 10,
    peakBAC,
    withinGoal,
  };
}

/**
 * Calculate statistics for a period (week or month)
 *
 * @param drinks - All drinks in the period (filtered by drink timestamp)
 * @param goals - Daily goals for the period
 * @param profile - User profile for BAC calculations
 * @param startDate - Period start date
 * @param endDate - Period end date
 * @param sessions - Optional: Sessions that STARTED in the period (for session-based peak BAC).
 *                   If provided, peakBAC is taken from sessions instead of calculated from drinks.
 *                   A session belongs to the period based on its start time.
 */
export function calculatePeriodStats(
  drinks: DrinkEntry[],
  goals: DailyGoal[],
  profile: UserProfile,
  startDate: Date,
  endDate: Date,
  sessions?: Session[]
): PeriodStats {
  const periodDrinks = getDrinksForPeriod(drinks, startDate, endDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Don't count future days - they shouldn't affect statistics
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  let totalDrinks = 0;
  let drinkingDays = 0;
  let soberDays = 0;
  let peakBAC = 0;
  let totalPeakBAC = 0;
  let daysWithBAC = 0;
  let goalsAchieved = 0;
  let goalsTotal = 0;
  let underLimitDays = 0;
  let overLimitDays = 0;

  // Calculate peak BAC from sessions if provided
  // Sessions are pre-filtered by the caller to only include those that STARTED in the period
  if (sessions && sessions.length > 0) {
    peakBAC = Math.max(...sessions.map(s => s.peakBAC));
  }

  for (const day of days) {
    // Skip future days - they shouldn't be counted
    if (day > today) {
      continue;
    }
    const dayDrinks = getDrinksForDay(periodDrinks, day);
    const dayString = format(day, 'yyyy-MM-dd');
    const dayGoal = goals.find(g => g.date === dayString);

    if (dayDrinks.length === 0) {
      soberDays++;
    } else {
      drinkingDays++;
      totalDrinks += dayDrinks.length;

      // Calculate peak BAC for this day (for average and goal checking)
      const timeSeries = calculateBACTimeSeries(dayDrinks, profile);

      // Only update peakBAC from drinks if sessions were not provided
      if (!sessions) {
        if (timeSeries.peakBAC > peakBAC) {
          peakBAC = timeSeries.peakBAC;
        }
      }

      totalPeakBAC += timeSeries.peakBAC;
      daysWithBAC++;

      // Use goal if set, otherwise use default
      const goalToUse = dayGoal ?? {
        maxBAC: DEFAULT_DAILY_GOAL.maxBAC,
        enabled: DEFAULT_DAILY_GOAL.enabled,
      };

      // Check if under or over limit (for drinking days only)
      if (goalToUse.enabled) {
        if (timeSeries.peakBAC < goalToUse.maxBAC) {
          underLimitDays++;
        } else {
          overLimitDays++;
        }
      } else {
        // If goal is disabled, count as under limit
        underLimitDays++;
      }

      // Check goal achievement (BAC limit only) - for explicit goals
      if (dayGoal && dayGoal.enabled) {
        goalsTotal++;
        if (timeSeries.peakBAC <= dayGoal.maxBAC) {
          goalsAchieved++;
        }
      }
    }
  }

  const averagePeakBAC = daysWithBAC > 0 ? totalPeakBAC / daysWithBAC : 0;
  const goalAchievementRate = goalsTotal > 0 ? (goalsAchieved / goalsTotal) * 100 : null;

  return {
    totalDrinks,
    drinkingDays,
    soberDays,
    peakBAC: Math.round(peakBAC * 100) / 100,
    averagePeakBAC: Math.round(averagePeakBAC * 100) / 100,
    goalAchievementRate: goalAchievementRate !== null ? Math.round(goalAchievementRate) : null,
    underLimitDays,
    overLimitDays,
  };
}

/**
 * Get the status of a day for calendar display
 * @deprecated Use getDayStatusBySession for session-based attribution
 */
export function getDayStatus(
  drinks: DrinkEntry[],
  goal: DailyGoal | null,
  profile: UserProfile,
  date: Date
): DayStatus {
  // Check if date is in the future - future days should have no status
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (date > today) {
    return 'no_data';
  }

  const dayDrinks = getDrinksForDay(drinks, date);

  if (dayDrinks.length === 0) {
    return 'sober';
  }

  // Use goal if set, otherwise use DEFAULT_DAILY_GOAL
  const goalToUse = goal ?? {
    id: 0,
    date: format(date, 'yyyy-MM-dd'),
    maxBAC: DEFAULT_DAILY_GOAL.maxBAC,
    enabled: DEFAULT_DAILY_GOAL.enabled,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!goalToUse.enabled) {
    return 'moderate'; // Goal disabled, show as moderate
  }

  // Check BAC limit - use same logic as checkBACLimitStatus
  const timeSeries = calculateBACTimeSeries(dayDrinks, profile);

  // Only show as over_limit if significantly over (>= 0.05‰ margin)
  // Exactly at the limit (within 0.05‰) counts as moderate, matching Session view
  if (timeSeries.peakBAC >= goalToUse.maxBAC + 0.05) {
    return 'over_limit';
  }

  return 'moderate';
}

/**
 * Session info for day status calculation
 */
export interface SessionInfo {
  startTime: string;
  peakBAC: number;
}

/**
 * Get the status of a day based on sessions that STARTED on that day
 * This is the session-based attribution model:
 * - A session belongs to the day it started
 * - If multiple sessions started on the same day, use the highest peak BAC
 * - If any session exceeded the limit, show as over_limit
 * - Days before journeyStartDate show as no_data (not part of the mindful journey)
 */
export function getDayStatusBySession(
  sessions: SessionInfo[],
  goal: DailyGoal | null,
  date: Date,
  journeyStartDate?: Date | null
): DayStatus {
  const dateString = format(date, 'yyyy-MM-dd');

  // Check if date is in the future - future days should have no status
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (date > today) {
    return 'no_data';
  }

  // Check if date is before the user's journey start - show as no_data
  if (journeyStartDate) {
    const journeyStart = startOfDay(journeyStartDate);
    if (date < journeyStart) {
      return 'no_data';
    }
  }

  // Filter sessions that started on this date
  const daySessions = sessions.filter(s => {
    const sessionStartDate = format(new Date(s.startTime), 'yyyy-MM-dd');
    return sessionStartDate === dateString;
  });

  if (daySessions.length === 0) {
    return 'sober';
  }

  // Use goal if set, otherwise use DEFAULT_DAILY_GOAL
  const goalToUse = goal ?? {
    id: 0,
    date: dateString,
    maxBAC: DEFAULT_DAILY_GOAL.maxBAC,
    enabled: DEFAULT_DAILY_GOAL.enabled,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!goalToUse.enabled) {
    return 'moderate'; // Goal disabled, show as moderate
  }

  // Find the highest peak BAC among all sessions that started on this day
  const highestPeakBAC = Math.max(...daySessions.map(s => s.peakBAC));

  if (highestPeakBAC >= goalToUse.maxBAC) {
    return 'over_limit';
  }

  return 'moderate';
}

/**
 * Count drinks for today
 */
export function getTodayDrinkCount(drinks: DrinkEntry[]): number {
  return getDrinksForDay(drinks, new Date()).length;
}

/**
 * Check BAC limit status
 * Returns whether adding a drink would reach or exceed the BAC limit
 */
export function checkBACLimitStatus(
  drinks: DrinkEntry[],
  goal: DailyGoal | null,
  profile: UserProfile,
  pendingDrink?: { volumeMl: number; abvPercent: number; timestamp: string }
): {
  status: 'under' | 'bac_reached' | 'bac_exceeded';
  currentPeakBAC: number;
  projectedPeakBAC: number;
} {
  if (!goal || !goal.enabled) {
    return {
      status: 'under',
      currentPeakBAC: 0,
      projectedPeakBAC: 0,
    };
  }

  // Calculate current peak BAC
  let currentPeakBAC = 0;
  if (drinks.length > 0) {
    const timeSeries = calculateBACTimeSeries(drinks, profile);
    currentPeakBAC = timeSeries.peakBAC;
  }

  // Calculate projected peak BAC with pending drink
  let projectedPeakBAC = currentPeakBAC;
  if (pendingDrink) {
    const allDrinks = [...drinks, {
      id: 0,
      timestamp: pendingDrink.timestamp,
      type: 'custom' as const,
      volumeMl: pendingDrink.volumeMl,
      abvPercent: pendingDrink.abvPercent,
      label: null,
      notes: null,
      sessionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    const timeSeries = calculateBACTimeSeries(allDrinks, profile);
    projectedPeakBAC = timeSeries.peakBAC;
  }

  // Check BAC limit
  // bacReached: exactly at the limit (within 0.05‰ margin)
  // bacExceeded: significantly over the limit (>= 0.05‰ over)
  const bacReached = projectedPeakBAC >= goal.maxBAC && projectedPeakBAC < goal.maxBAC + 0.05;
  const bacExceeded = projectedPeakBAC >= goal.maxBAC + 0.05;

  let status: 'under' | 'bac_reached' | 'bac_exceeded' = 'under';
  if (bacExceeded) {
    status = 'bac_exceeded';
  } else if (bacReached) {
    status = 'bac_reached';
  }

  return {
    status,
    currentPeakBAC,
    projectedPeakBAC,
  };
}
