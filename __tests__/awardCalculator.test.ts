/**
 * Award Calculator Tests
 *
 * Tests for the pure calculation functions in awardCalculator.ts.
 * These tests verify the streak calculation logic for the "Limit Keeper" award.
 */

import { format, subDays } from 'date-fns';
import {
  calculateLimitKeeperStreak,
  isDayUnderLimit,
  isSessionUnderLimit,
  calculateAllAwards,
  calculateMindfulDrinkerStreak,
} from '../src/domain/services/awardCalculator';
import { Session, DailyGoal } from '../src/domain/models/types';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockSession(
  daysAgo: number,
  peakBAC: number,
  id: number = 1
): Session {
  const startTime = subDays(new Date(), daysAgo);
  startTime.setHours(20, 0, 0, 0); // 8 PM
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 4); // 4 hours later

  return {
    id,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    peakBAC,
    peakTime: startTime.toISOString(),
    totalStandardUnits: peakBAC * 2, // Rough approximation
    createdAt: startTime.toISOString(),
    updatedAt: startTime.toISOString(),
  };
}

function createMockGoal(daysAgo: number, maxBAC: number): DailyGoal {
  const date = subDays(new Date(), daysAgo);
  return {
    id: 1,
    date: format(date, 'yyyy-MM-dd'),
    maxBAC,
    enabled: true,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('awardCalculator', () => {
  describe('calculateLimitKeeperStreak', () => {
    it('should return 0 streak with no sessions (nothing to measure yet)', () => {
      const sessions: Session[] = [];
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // With no sessions, we can't measure anything - streak starts when tracking starts
      expect(result.currentStreak).toBe(0);
      expect(result.awardId).toBe('limit_keeper');
    });

    it('should count consecutive days under limit', () => {
      // Create sessions for 3 consecutive days, all under 0.5 limit
      const sessions: Session[] = [
        createMockSession(0, 0.3, 1), // Today
        createMockSession(1, 0.4, 2), // Yesterday
        createMockSession(2, 0.2, 3), // 2 days ago
      ];
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // All 3 days + additional sober days should be under limit
      expect(result.currentStreak).toBeGreaterThanOrEqual(3);
    });

    it('should reset streak when limit is exceeded', () => {
      // Day 0: under limit
      // Day 1: over limit (breaks streak)
      // Day 2: under limit
      const sessions: Session[] = [
        createMockSession(0, 0.3, 1),  // Today - under limit
        createMockSession(1, 0.8, 2),  // Yesterday - OVER limit (breaks streak)
        createMockSession(2, 0.2, 3),  // 2 days ago - under limit
      ];
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // Streak should be 1 (only today)
      expect(result.currentStreak).toBe(1);
    });

    it('should treat sober days as under limit', () => {
      // Only drink on day 2, under limit
      // Days 0 and 1 are sober
      const sessions: Session[] = [
        createMockSession(2, 0.3, 1), // 2 days ago - under limit
      ];
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // Days 0, 1, and 2 all count as under limit
      expect(result.currentStreak).toBeGreaterThanOrEqual(3);
    });

    it('should use custom goal when set', () => {
      // Set a custom goal of 0.3 for today
      const sessions: Session[] = [
        createMockSession(0, 0.4, 1), // Today - 0.4 BAC
      ];
      const goals: DailyGoal[] = [
        createMockGoal(0, 0.3), // Today's goal: 0.3 (session is OVER)
      ];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // Today is over the custom limit, so streak is 0
      expect(result.currentStreak).toBe(0);
    });

    it('should use default goal (0.5) when no goal is set', () => {
      const sessions: Session[] = [
        createMockSession(0, 0.4, 1), // Today - 0.4 BAC (under default 0.5)
      ];
      const goals: DailyGoal[] = []; // No goals

      const result = calculateLimitKeeperStreak(sessions, goals);

      // 0.4 is under the default 0.5 limit
      expect(result.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('should return milestones reached for 7+ day streak', () => {
      // Create 8 days of sessions all under limit
      const sessions: Session[] = [];
      for (let i = 0; i < 8; i++) {
        sessions.push(createMockSession(i, 0.3, i + 1));
      }
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      expect(result.currentStreak).toBeGreaterThanOrEqual(8);
      expect(result.milestonesReached).toContain(7);
    });

    it('should handle BAC exactly at limit (equals is under)', () => {
      const sessions: Session[] = [
        createMockSession(0, 0.5, 1), // Exactly at 0.5 limit
      ];
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // BAC === limit should be treated as under limit
      expect(result.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple sessions on the same day', () => {
      // Two sessions on the same day, one under, one over
      const today = new Date();
      const session1: Session = {
        id: 1,
        startTime: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
        endTime: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        peakBAC: 0.3,
        peakTime: today.toISOString(),
        totalStandardUnits: 1,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      };
      const session2: Session = {
        id: 2,
        startTime: new Date(today.setHours(20, 0, 0, 0)).toISOString(),
        endTime: new Date(today.setHours(23, 0, 0, 0)).toISOString(),
        peakBAC: 0.8, // OVER limit
        peakTime: today.toISOString(),
        totalStandardUnits: 3,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      };

      const sessions = [session1, session2];
      const goals: DailyGoal[] = [];

      const result = calculateLimitKeeperStreak(sessions, goals);

      // Day should be over limit because one session exceeded
      expect(result.currentStreak).toBe(0);
    });
  });

  describe('isDayUnderLimit', () => {
    it('should return true for sober day', () => {
      const sessionsByDate = new Map<string, Session[]>();
      const goalsByDate = new Map<string, DailyGoal>();
      const today = format(new Date(), 'yyyy-MM-dd');

      const result = isDayUnderLimit(today, sessionsByDate, goalsByDate);

      expect(result).toBe(true);
    });

    it('should return true when all sessions are under limit', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sessionsByDate = new Map<string, Session[]>();
      sessionsByDate.set(today, [createMockSession(0, 0.3, 1)]);

      const goalsByDate = new Map<string, DailyGoal>();

      const result = isDayUnderLimit(today, sessionsByDate, goalsByDate);

      expect(result).toBe(true);
    });

    it('should return false when any session is over limit', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sessionsByDate = new Map<string, Session[]>();
      sessionsByDate.set(today, [
        createMockSession(0, 0.3, 1),
        createMockSession(0, 0.8, 2), // Over limit
      ]);

      const goalsByDate = new Map<string, DailyGoal>();

      const result = isDayUnderLimit(today, sessionsByDate, goalsByDate);

      expect(result).toBe(false);
    });

    it('should use goal for specific day', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sessionsByDate = new Map<string, Session[]>();
      sessionsByDate.set(today, [createMockSession(0, 0.4, 1)]);

      const goalsByDate = new Map<string, DailyGoal>();
      goalsByDate.set(today, createMockGoal(0, 0.3)); // Custom goal: 0.3

      const result = isDayUnderLimit(today, sessionsByDate, goalsByDate);

      // 0.4 > 0.3, so over limit
      expect(result).toBe(false);
    });
  });

  describe('isSessionUnderLimit', () => {
    it('should return true when session BAC <= goal', () => {
      const session = createMockSession(0, 0.3, 1);
      const goals = [createMockGoal(0, 0.5)];

      const result = isSessionUnderLimit(session, goals);

      expect(result).toBe(true);
    });

    it('should return false when session BAC > goal', () => {
      const session = createMockSession(0, 0.8, 1);
      const goals = [createMockGoal(0, 0.5)];

      const result = isSessionUnderLimit(session, goals);

      expect(result).toBe(false);
    });

    it('should use default goal when no goal exists for day', () => {
      const session = createMockSession(0, 0.4, 1);
      const goals: DailyGoal[] = []; // No goals

      const result = isSessionUnderLimit(session, goals);

      // Default is 0.5, so 0.4 should be under
      expect(result).toBe(true);
    });
  });

  describe('calculateAllAwards', () => {
    it('should return limit_keeper in results', () => {
      const sessions: Session[] = [];
      const goals: DailyGoal[] = [];

      const result = calculateAllAwards(sessions, goals);

      expect(result).toHaveProperty('limit_keeper');
      expect(result.limit_keeper.awardId).toBe('limit_keeper');
    });

    it('should return all award types with defaults', () => {
      const sessions: Session[] = [];
      const goals: DailyGoal[] = [];

      const result = calculateAllAwards(sessions, goals);

      expect(result.limit_keeper).toBeDefined();
      expect(result.mindful_drinker).toBeDefined();

      // Awards should have 0 streak when no sessions
      expect(result.mindful_drinker.currentStreak).toBe(0);
    });
  });
});

describe('Award Milestones', () => {
  it('should include 7 in milestones for 7+ day streak', () => {
    const sessions: Session[] = [];
    // Create 10 days of under-limit sessions
    for (let i = 0; i < 10; i++) {
      sessions.push(createMockSession(i, 0.3, i + 1));
    }

    const result = calculateLimitKeeperStreak(sessions, []);

    expect(result.milestonesReached).toContain(7);
  });

  it('should include 14 in milestones for 14+ day streak', () => {
    const sessions: Session[] = [];
    // Create 15 days of under-limit sessions
    for (let i = 0; i < 15; i++) {
      sessions.push(createMockSession(i, 0.3, i + 1));
    }

    const result = calculateLimitKeeperStreak(sessions, []);

    expect(result.milestonesReached).toContain(7);
    expect(result.milestonesReached).toContain(14);
  });

  it('should not include milestones not yet reached when streak broken', () => {
    // Create a session over limit 3 days ago to break the streak
    const sessions: Session[] = [
      createMockSession(0, 0.3, 1), // Today - under
      createMockSession(1, 0.3, 2), // Yesterday - under
      createMockSession(2, 0.3, 3), // 2 days ago - under
      createMockSession(3, 0.8, 4), // 3 days ago - OVER (breaks streak)
    ];

    const result = calculateLimitKeeperStreak(sessions, []);

    // Only 3 days streak (0, 1, 2), shouldn't have 7-day milestone
    expect(result.currentStreak).toBe(3);
    expect(result.milestonesReached).not.toContain(7);
  });
});

// ============================================================================
// Phase 2 Award Tests
// ============================================================================

describe('calculateMindfulDrinkerStreak', () => {
  it('should return 0 streak with no sessions', () => {
    const sessions: Session[] = [];
    const goals: DailyGoal[] = [];

    const result = calculateMindfulDrinkerStreak(sessions, goals);

    expect(result.currentStreak).toBe(0);
    expect(result.awardId).toBe('mindful_drinker');
  });

  it('should count consecutive sessions under limit', () => {
    const sessions: Session[] = [
      createMockSession(0, 0.3, 1), // Most recent - under
      createMockSession(1, 0.4, 2), // Second - under
      createMockSession(2, 0.2, 3), // Third - under
    ];
    const goals: DailyGoal[] = [];

    const result = calculateMindfulDrinkerStreak(sessions, goals);

    expect(result.currentStreak).toBe(3);
  });

  it('should reset streak when session exceeds limit', () => {
    const sessions: Session[] = [
      createMockSession(0, 0.3, 1), // Most recent - under
      createMockSession(1, 0.8, 2), // OVER limit - breaks streak
      createMockSession(2, 0.2, 3), // Under but before break
    ];
    const goals: DailyGoal[] = [];

    const result = calculateMindfulDrinkerStreak(sessions, goals);

    // Only most recent session counts
    expect(result.currentStreak).toBe(1);
  });

  it('should use custom goal for session day', () => {
    const sessions: Session[] = [
      createMockSession(0, 0.4, 1), // Under default 0.5 but over custom 0.3
    ];
    const goals: DailyGoal[] = [
      createMockGoal(0, 0.3), // Custom goal: 0.3
    ];

    const result = calculateMindfulDrinkerStreak(sessions, goals);

    // 0.4 > 0.3 custom limit
    expect(result.currentStreak).toBe(0);
  });

  it('should return milestones for 5+ session streak', () => {
    const sessions: Session[] = [];
    for (let i = 0; i < 6; i++) {
      sessions.push(createMockSession(i, 0.3, i + 1));
    }

    const result = calculateMindfulDrinkerStreak(sessions, []);

    expect(result.currentStreak).toBe(6);
    expect(result.milestonesReached).toContain(5);
  });
});

describe('calculateAllAwards', () => {
  it('should return active streak awards', () => {
    const sessions: Session[] = [
      createMockSession(0, 0.3, 1),
      createMockSession(1, 0.4, 2),
    ];
    const goals: DailyGoal[] = [];

    const result = calculateAllAwards(sessions, goals);

    // Active awards
    expect(result).toHaveProperty('limit_keeper');
    expect(result).toHaveProperty('mindful_drinker');
  });

  it('should calculate correct values for active awards', () => {
    const sessions: Session[] = [
      createMockSession(0, 0.3, 1), // Today - under
      createMockSession(1, 0.3, 2), // Yesterday - under
    ];

    const result = calculateAllAwards(sessions, []);

    // mindful_drinker: 2 consecutive sessions under limit
    expect(result.mindful_drinker.currentStreak).toBe(2);

    // limit_keeper: at least 2 days under limit
    expect(result.limit_keeper.currentStreak).toBeGreaterThanOrEqual(2);
  });
});
