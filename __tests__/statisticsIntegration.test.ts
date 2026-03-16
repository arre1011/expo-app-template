import {
  getDayStatus,
  calculateDailyStats,
  calculatePeriodStats,
  getDrinksForDay,
  getDrinksForPeriod,
} from '../src/domain/services/statistics';
import { UserProfile, DrinkEntry, DailyGoal } from '../src/domain/models/types';
import { startOfDay, subDays } from 'date-fns';

/**
 * Integration Tests for Statistics
 *
 * These tests verify that statistics are calculated correctly
 * and consistently across different views (calendar, statistics page, home)
 *
 * Bug History:
 * - Adding drinks sometimes didn't update calendar/statistics
 * - State synchronization issues between stores
 */
describe('Statistics Integration', () => {
  const mockProfile: UserProfile = {
    id: 1,
    weightKg: 80,
    sex: 'male',
    bodyWaterConstantR: 0.68,
    eliminationRatePermillePerHour: 0.15,
    weightUnit: 'lb',
    volumeUnit: 'ml',
    bacUnit: 'percent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockGoal: DailyGoal = {
    id: 1,
    date: '2025-01-15',
    maxBAC: 0.5,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createMockDrink = (
    id: number,
    volumeMl: number,
    abvPercent: number,
    timestamp: Date
  ): DrinkEntry => ({
    id,
    timestamp: timestamp.toISOString(),
    type: 'custom',
    volumeMl,
    abvPercent,
    label: null,
    notes: null,
    sessionId: null,
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString(),
  });

  describe('getDrinksForDay', () => {
    it('should filter drinks for a specific day', () => {
      const today = new Date();
      const yesterday = subDays(today, 1);

      const drinks: DrinkEntry[] = [
        createMockDrink(1, 330, 5.0, today),
        createMockDrink(2, 330, 5.0, yesterday),
        createMockDrink(3, 500, 5.0, today),
      ];

      const todayDrinks = getDrinksForDay(drinks, today);

      expect(todayDrinks).toHaveLength(2);
      expect(todayDrinks[0].id).toBe(1);
      expect(todayDrinks[1].id).toBe(3);
    });

    it('should return empty array when no drinks on that day', () => {
      const today = new Date();
      const yesterday = subDays(today, 1);

      const drinks: DrinkEntry[] = [
        createMockDrink(1, 330, 5.0, yesterday),
      ];

      const todayDrinks = getDrinksForDay(drinks, today);
      expect(todayDrinks).toHaveLength(0);
    });

    it('should handle drinks at start and end of day', () => {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59);

      const drinks: DrinkEntry[] = [
        createMockDrink(1, 330, 5.0, startOfToday),
        createMockDrink(2, 330, 5.0, endOfToday),
      ];

      const todayDrinks = getDrinksForDay(drinks, today);
      expect(todayDrinks).toHaveLength(2);
    });
  });

  describe('getDrinksForPeriod', () => {
    it('should filter drinks for a date range', () => {
      const today = new Date();
      const threeDaysAgo = subDays(today, 3);
      const sevenDaysAgo = subDays(today, 7);

      const drinks: DrinkEntry[] = [
        createMockDrink(1, 330, 5.0, sevenDaysAgo), // Outside range
        createMockDrink(2, 330, 5.0, threeDaysAgo), // In range
        createMockDrink(3, 330, 5.0, subDays(today, 1)), // In range
        createMockDrink(4, 330, 5.0, today), // In range
      ];

      const periodDrinks = getDrinksForPeriod(drinks, threeDaysAgo, today);

      expect(periodDrinks).toHaveLength(3);
      expect(periodDrinks.map(d => d.id)).toEqual([2, 3, 4]);
    });
  });

  describe('calculateDailyStats', () => {
    it('should calculate correct stats for a day with drinks', () => {
      const today = new Date();
      const drinks: DrinkEntry[] = [
        createMockDrink(1, 500, 5.0, today), // 19.725g alcohol
        createMockDrink(2, 500, 5.0, today), // 19.725g alcohol
      ];

      const stats = calculateDailyStats(drinks, mockGoal, mockProfile, today);

      expect(stats.drinkCount).toBe(2);
      expect(stats.totalAlcoholGrams).toBeCloseTo(39.45, 1); // 2 * 19.725g
      expect(stats.peakBAC).toBeGreaterThan(0);
      expect(stats.withinGoal).toBe(false); // 2 beers should exceed 0.5‰ limit
    });

    it('should calculate correct stats for a sober day', () => {
      const today = new Date();
      const drinks: DrinkEntry[] = [];

      const stats = calculateDailyStats(drinks, mockGoal, mockProfile, today);

      expect(stats.drinkCount).toBe(0);
      expect(stats.totalAlcoholGrams).toBe(0);
      expect(stats.peakBAC).toBe(0);
      expect(stats.withinGoal).toBe(true); // No drinks = within goal
    });

    it('should mark day as within goal when under limit', () => {
      const today = new Date();
      const drinks: DrinkEntry[] = [
        createMockDrink(1, 200, 5.0, today), // Small amount
      ];

      const stats = calculateDailyStats(drinks, mockGoal, mockProfile, today);

      expect(stats.withinGoal).toBe(true);
      expect(stats.peakBAC).toBeLessThan(mockGoal.maxBAC);
    });

    it('should handle no goal set', () => {
      const today = new Date();
      const drinks: DrinkEntry[] = [
        createMockDrink(1, 500, 5.0, today),
      ];

      const stats = calculateDailyStats(drinks, null, mockProfile, today);

      expect(stats.withinGoal).toBeNull(); // No goal = null
    });
  });

  describe('calculatePeriodStats', () => {
    it('should calculate weekly stats correctly', () => {
      const today = new Date();
      const weekAgo = subDays(today, 7);

      const drinks: DrinkEntry[] = [
        // Day 1: 2 drinks
        createMockDrink(1, 500, 5.0, subDays(today, 6)),
        createMockDrink(2, 500, 5.0, subDays(today, 6)),
        // Day 2: 0 drinks (sober)
        // Day 3: 1 drink
        createMockDrink(3, 330, 5.0, subDays(today, 4)),
        // Days 4-7: 0 drinks (sober)
      ];

      const goals: DailyGoal[] = [];

      const stats = calculatePeriodStats(drinks, goals, mockProfile, weekAgo, today);

      expect(stats.totalDrinks).toBe(3);
      expect(stats.drinkingDays).toBe(2);
      expect(stats.soberDays).toBeGreaterThan(0);
      expect(stats.peakBAC).toBeGreaterThan(0);
      expect(stats.averagePeakBAC).toBeGreaterThan(0);
    });

    it('should calculate goal achievement rate', () => {
      const today = new Date();
      const weekAgo = subDays(today, 7);

      const drinks: DrinkEntry[] = [
        // Day 1: under goal
        createMockDrink(1, 200, 5.0, subDays(today, 6)),
        // Day 2: over goal
        createMockDrink(2, 500, 5.0, subDays(today, 5)),
        createMockDrink(3, 500, 5.0, subDays(today, 5)),
      ];

      const goals: DailyGoal[] = [
        { ...mockGoal, date: new Date(subDays(today, 6)).toISOString().split('T')[0] },
        { ...mockGoal, date: new Date(subDays(today, 5)).toISOString().split('T')[0] },
      ];

      const stats = calculatePeriodStats(drinks, goals, mockProfile, weekAgo, today);

      expect(stats.goalAchievementRate).toBeLessThan(100); // Not all goals achieved
      expect(stats.goalAchievementRate).toBeGreaterThan(0); // But some were
    });

    it('should handle period with no drinks', () => {
      const today = new Date();
      const weekAgo = subDays(today, 7);

      const stats = calculatePeriodStats([], [], mockProfile, weekAgo, today);

      expect(stats.totalDrinks).toBe(0);
      expect(stats.drinkingDays).toBe(0);
      expect(stats.soberDays).toBeGreaterThan(0);
      expect(stats.peakBAC).toBe(0);
      expect(stats.averagePeakBAC).toBe(0);
      expect(stats.goalAchievementRate).toBeNull(); // No goals set
    });
  });

  describe('Real-world scenarios - Cross-view consistency', () => {
    it('Scenario: Add drink and verify it appears in all views', () => {
      // This simulates: User adds drink → should appear in home, calendar, and statistics

      const today = new Date();
      const newDrink = createMockDrink(1, 500, 5.0, today);
      const allDrinks = [newDrink];

      // 1. Home view: Calculate current BAC and session
      const todayDrinks = getDrinksForDay(allDrinks, today);
      expect(todayDrinks).toHaveLength(1);

      // 2. Calendar view: Check day status
      const dayStatus = getDayStatus(allDrinks, mockGoal, mockProfile, today);
      expect(dayStatus).not.toBe('sober'); // Should show as drinking day

      // 3. Statistics view: Daily stats
      const dailyStats = calculateDailyStats(allDrinks, mockGoal, mockProfile, today);
      expect(dailyStats.drinkCount).toBe(1);
      expect(dailyStats.peakBAC).toBeGreaterThan(0);
    });

    it('Scenario: Delete drink and verify it disappears from all views', () => {
      const today = new Date();
      const drink1 = createMockDrink(1, 500, 5.0, today);
      const drink2 = createMockDrink(2, 330, 5.0, today);

      // Before delete: 2 drinks
      const beforeDrinks = [drink1, drink2];
      expect(getDrinksForDay(beforeDrinks, today)).toHaveLength(2);

      // After delete: 1 drink
      const afterDrinks = [drink2]; // drink1 deleted
      const todayDrinks = getDrinksForDay(afterDrinks, today);
      expect(todayDrinks).toHaveLength(1);
      expect(todayDrinks[0].id).toBe(2);

      // Verify stats updated
      const dailyStats = calculateDailyStats(afterDrinks, mockGoal, mockProfile, today);
      expect(dailyStats.drinkCount).toBe(1);
    });

    it('Scenario: Drinks from different days dont interfere', () => {
      const today = new Date();
      const yesterday = subDays(today, 1);

      const drinks: DrinkEntry[] = [
        createMockDrink(1, 500, 5.0, yesterday),
        createMockDrink(2, 500, 5.0, yesterday),
        createMockDrink(3, 330, 5.0, today),
      ];

      // Today should only show 1 drink
      const todayDrinks = getDrinksForDay(drinks, today);
      expect(todayDrinks).toHaveLength(1);

      // Yesterday should show 2 drinks
      const yesterdayDrinks = getDrinksForDay(drinks, yesterday);
      expect(yesterdayDrinks).toHaveLength(2);

      // Daily stats for today should only count today's drink
      const todayStats = calculateDailyStats(drinks, mockGoal, mockProfile, today);
      expect(todayStats.drinkCount).toBe(1);

      // Daily stats for yesterday should count yesterday's drinks
      const yesterdayStats = calculateDailyStats(drinks, mockGoal, mockProfile, yesterday);
      expect(yesterdayStats.drinkCount).toBe(2);
    });
  });
});
