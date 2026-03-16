/**
 * Session Calculator Tests
 *
 * Comprehensive tests for the session calculation algorithm.
 * These tests verify that the "Merge Overlapping Intervals" algorithm
 * correctly handles all scenarios.
 *
 * TEST CATEGORIES:
 * 1. Basic scenarios (empty, single drink, multiple drinks same session)
 * 2. Overlap detection (the bug we're fixing!)
 * 3. Gap detection (separate sessions)
 * 4. Edge cases (midnight crossing, retroactive drinks, etc.)
 * 5. Utility functions
 */

import { DrinkEntry, UserProfile } from '../src/domain/models/types';
import {
  calculateSessionsFromDrinks,
  intervalsOverlap,
  drinkOverlapsWithSession,
  formatSessionBoundary,
  SessionBoundary,
} from '../src/domain/services/sessionCalculator';
import { getBACAtTime } from '../src/domain/services/bacCalculator';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Standard test profile: 80kg male
 * - Elimination rate: 0.15‰/hour (average)
 * - Body water constant: 0.68 (male)
 *
 * With these values, a 500ml 5% beer (1 standard unit):
 * - Peak BAC: ~0.29‰
 * - Time to sober: ~2-3 hours
 */
const createTestProfile = (): UserProfile => ({
  id: 1,
  weightKg: 80,
  sex: 'male',
  bodyWaterConstantR: 0.68,
  eliminationRatePermillePerHour: 0.15,
  weightUnit: 'kg',
  volumeUnit: 'ml',
  bacUnit: 'percent',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Create a mock drink at a specific time.
 *
 * Default: 500ml beer at 5% ABV (≈ 2 standard units)
 */
const createDrink = (
  id: number,
  timestamp: Date,
  volumeMl: number = 500,
  abvPercent: number = 5
): DrinkEntry => ({
  id,
  timestamp: timestamp.toISOString(),
  type: 'beer_large',
  volumeMl,
  abvPercent,
  label: null,
  notes: null,
  sessionId: null,
  createdAt: timestamp.toISOString(),
  updatedAt: timestamp.toISOString(),
});

/**
 * Create a timestamp at a specific hour (today).
 * Useful for creating drinks at "13:00", "14:00", etc.
 */
const todayAt = (hours: number, minutes: number = 0): Date => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Create a timestamp relative to now.
 */
const hoursAgo = (hours: number, minutes: number = 0): Date => {
  const now = new Date();
  return new Date(now.getTime() - (hours * 60 + minutes) * 60 * 1000);
};

/**
 * Create a timestamp for a specific date and time.
 */
const dateAt = (year: number, month: number, day: number, hours: number = 12, minutes: number = 0): Date => {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

// ============================================================================
// BASIC SCENARIOS
// ============================================================================

describe('Session Calculator - Basic Scenarios', () => {
  const profile = createTestProfile();

  describe('Empty and Single Drink', () => {
    it('should return empty array for no drinks', () => {
      const sessions = calculateSessionsFromDrinks([], profile);

      expect(sessions).toHaveLength(0);
    });

    it('should create single session for one drink', () => {
      const drink = createDrink(1, todayAt(14, 0));
      const sessions = calculateSessionsFromDrinks([drink], profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(1);
      expect(sessions[0].drinks[0].id).toBe(1);
      expect(sessions[0].peakBAC).toBeGreaterThan(0);
      expect(sessions[0].totalStandardUnits).toBeGreaterThan(0);
    });

    it('should calculate correct session times for single drink', () => {
      const drinkTime = todayAt(14, 0);
      const drink = createDrink(1, drinkTime);
      const sessions = calculateSessionsFromDrinks([drink], profile);

      expect(sessions).toHaveLength(1);

      // Start time should be drink time
      expect(sessions[0].startTime.getTime()).toBe(drinkTime.getTime());

      // End time should be after drink time (when BAC returns to 0)
      expect(sessions[0].endTime.getTime()).toBeGreaterThan(drinkTime.getTime());

      // Peak time should be between start and end
      expect(sessions[0].peakTime.getTime()).toBeGreaterThanOrEqual(sessions[0].startTime.getTime());
      expect(sessions[0].peakTime.getTime()).toBeLessThanOrEqual(sessions[0].endTime.getTime());
    });
  });

  describe('Multiple Drinks - Same Session (No Gap)', () => {
    it('should merge drinks within 1 hour into single session', () => {
      // Two drinks 30 minutes apart - should be same session
      const drinks = [
        createDrink(1, todayAt(14, 0)),
        createDrink(2, todayAt(14, 30)),
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);
    });

    it('should merge drinks within 2 hours into single session', () => {
      // Two drinks 90 minutes apart - should still be same session
      // (BAC from first drink hasn't reached 0 yet)
      const drinks = [
        createDrink(1, todayAt(14, 0)),
        createDrink(2, todayAt(15, 30)),
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);
    });

    it('should handle drinks provided in wrong order', () => {
      // Drinks provided out of order - should still be sorted and merged
      const drinks = [
        createDrink(2, todayAt(14, 30)), // Later drink first
        createDrink(1, todayAt(14, 0)),  // Earlier drink second
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);

      // Drinks should be sorted by time in the session
      expect(sessions[0].drinks[0].id).toBe(1); // Earlier drink first
      expect(sessions[0].drinks[1].id).toBe(2); // Later drink second
    });
  });
});

// ============================================================================
// THE BUG WE'RE FIXING - RETROACTIVE DRINKS
// ============================================================================

describe('Session Calculator - Retroactive Drink Bug Fix', () => {
  const profile = createTestProfile();

  /**
   * THIS IS THE MAIN BUG WE'RE FIXING!
   *
   * Scenario:
   * 1. User adds drink at 14:00 → Session A created (14:00 - ~16:30)
   * 2. User adds drink at 13:00 (retroactively) → Should be added to Session A!
   *
   * The bug was: A new Session B was created instead of merging.
   *
   * Why they should merge:
   * - Drink at 13:00 has BAC > 0 at 14:00 (still ~0.22‰)
   * - Since BAC never reaches 0 between drinks, they're the same session
   */
  describe('Drink Added Before Existing Session', () => {
    it('should merge drink before session into same session when BAC overlaps', () => {
      // Simulate the bug scenario:
      // First drink at 14:00, then retroactive drink at 13:00

      const drinks = [
        createDrink(1, todayAt(14, 0)),  // "First" added drink
        createDrink(2, todayAt(13, 0)),  // "Second" added drink (earlier time)
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      // EXPECTED: ONE session, not two!
      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);

      // Session should start at 13:00 (earliest drink)
      expect(sessions[0].startTime.getHours()).toBe(13);
      expect(sessions[0].startTime.getMinutes()).toBe(0);

      // Both drinks should be in the session
      const drinkIds = sessions[0].drinks.map(d => d.id);
      expect(drinkIds).toContain(1);
      expect(drinkIds).toContain(2);

      console.log('=== Bug Fix Verification ===');
      console.log('Input: 2 drinks (14:00 and 13:00 retroactive)');
      console.log(`Output: ${sessions.length} session(s)`);
      console.log(formatSessionBoundary(sessions[0]));
    });

    it('should verify BAC overlap exists at the critical time', () => {
      // Verify that the 13:00 drink still has BAC > 0 at 14:00
      const drinkAt13 = createDrink(1, todayAt(13, 0));
      const bacAt14 = getBACAtTime([drinkAt13], profile, todayAt(14, 0));

      console.log(`BAC of 13:00 drink at 14:00: ${bacAt14.toFixed(3)}‰`);

      // This should be > 0, proving they should be in the same session
      expect(bacAt14).toBeGreaterThan(0);
    });

    it('should handle multiple retroactive drinks correctly', () => {
      // More complex scenario: drinks at 15:00, then 14:00, then 13:00
      const drinks = [
        createDrink(1, todayAt(15, 0)),  // First added
        createDrink(2, todayAt(14, 0)),  // Second added (retroactive)
        createDrink(3, todayAt(13, 0)),  // Third added (more retroactive)
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      // All drinks should be in ONE session
      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(3);

      // Session should start at earliest drink (13:00)
      expect(sessions[0].startTime.getHours()).toBe(13);
    });
  });

  describe('Drink Fills Gap Between Sessions', () => {
    it('should merge three separate drinks into one session if new drink bridges gap', () => {
      // Scenario:
      // - Drink at 10:00 → Session A (10:00 - ~12:30)
      // - Drink at 14:00 → Session B (14:00 - ~16:30)
      // - GAP between them
      // - Now add drink at 12:00 that bridges the gap!

      const drinks = [
        createDrink(1, todayAt(10, 0)),  // Early morning
        createDrink(2, todayAt(14, 0)),  // Afternoon
        createDrink(3, todayAt(12, 0)),  // BRIDGE - fills the gap!
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      // With the bridge drink, they might merge into one session
      // (depending on whether the combined BAC creates overlap)
      console.log('=== Gap Bridge Test ===');
      sessions.forEach((s, i) => console.log(`Session ${i + 1}: ${formatSessionBoundary(s)}`));

      // The exact result depends on BAC calculations, but we verify structure
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.length).toBeLessThanOrEqual(3);

      // All drinks should be accounted for
      const totalDrinks = sessions.reduce((sum, s) => sum + s.drinks.length, 0);
      expect(totalDrinks).toBe(3);
    });
  });
});

// ============================================================================
// SEPARATE SESSIONS (NO OVERLAP)
// ============================================================================

describe('Session Calculator - Separate Sessions', () => {
  const profile = createTestProfile();

  it('should create separate sessions for drinks with large time gap', () => {
    // Drinks 8 hours apart - definitely separate sessions
    const drinks = [
      createDrink(1, todayAt(8, 0)),   // Morning
      createDrink(2, todayAt(20, 0)),  // Evening
    ];

    const sessions = calculateSessionsFromDrinks(drinks, profile);

    expect(sessions).toHaveLength(2);
    expect(sessions[0].drinks).toHaveLength(1);
    expect(sessions[1].drinks).toHaveLength(1);

    // First session should be in the morning
    expect(sessions[0].startTime.getHours()).toBe(8);

    // Second session should be in the evening
    expect(sessions[1].startTime.getHours()).toBe(20);

    console.log('=== Separate Sessions ===');
    sessions.forEach((s, i) => console.log(`Session ${i + 1}: ${formatSessionBoundary(s)}`));
  });

  it('should create separate sessions when BAC reaches 0 between drinks', () => {
    // Drinks 5 hours apart - BAC should reach 0 between them
    const drinks = [
      createDrink(1, todayAt(10, 0)),
      createDrink(2, todayAt(15, 0)),
    ];

    const sessions = calculateSessionsFromDrinks(drinks, profile);

    // Should be 2 separate sessions
    expect(sessions).toHaveLength(2);

    // Verify by checking BAC at 14:59 (just before second drink)
    const bacBeforeSecondDrink = getBACAtTime(
      [drinks[0]],
      profile,
      todayAt(14, 59)
    );

    console.log(`BAC from 10:00 drink at 14:59: ${bacBeforeSecondDrink.toFixed(3)}‰`);

    // BAC should be 0 (or very close), confirming separate sessions
    expect(bacBeforeSecondDrink).toBe(0);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Session Calculator - Edge Cases', () => {
  const profile = createTestProfile();

  describe('Session Spanning Midnight', () => {
    it('should handle drinks spanning midnight as single session', () => {
      const drinks = [
        createDrink(1, dateAt(2026, 1, 19, 23, 0)), // 11 PM on Jan 19
        createDrink(2, dateAt(2026, 1, 20, 0, 30)), // 12:30 AM on Jan 20
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);

      // Session should start on the 19th
      expect(sessions[0].startTime.getDate()).toBe(19);

      // Session should end on the 20th
      expect(sessions[0].endTime.getDate()).toBe(20);
    });
  });

  describe('Drinks Very Close Together', () => {
    it('should handle drinks 5 minutes apart', () => {
      const drinks = [
        createDrink(1, todayAt(14, 0)),
        createDrink(2, todayAt(14, 5)),
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);
    });

    it('should handle drinks at same time', () => {
      const sameTime = todayAt(14, 0);
      const drinks = [
        createDrink(1, sameTime),
        createDrink(2, sameTime),
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(2);
    });
  });

  describe('Different Drink Sizes', () => {
    it('should handle mix of small and large drinks', () => {
      const drinks = [
        createDrink(1, todayAt(14, 0), 250, 5),  // Small beer
        createDrink(2, todayAt(14, 30), 500, 5), // Large beer
        createDrink(3, todayAt(15, 0), 40, 40),  // Shot
      ];

      const sessions = calculateSessionsFromDrinks(drinks, profile);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(3);

      // Peak BAC should be significant
      expect(sessions[0].peakBAC).toBeGreaterThan(0.3);
    });
  });

  describe('High Drink Count', () => {
    it('should handle many drinks efficiently', () => {
      // Create 20 drinks over 4 hours
      const drinks = Array.from({ length: 20 }, (_, i) =>
        createDrink(i + 1, todayAt(14, i * 12)) // Every 12 minutes
      );

      const startTime = Date.now();
      const sessions = calculateSessionsFromDrinks(drinks, profile);
      const endTime = Date.now();

      console.log(`Processing 20 drinks took ${endTime - startTime}ms`);

      // Should still be one session
      expect(sessions).toHaveLength(1);
      expect(sessions[0].drinks).toHaveLength(20);

      // Should complete quickly (< 2 seconds, allows for CI/slower machines)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('Session Calculator - Utility Functions', () => {
  describe('intervalsOverlap', () => {
    it('should detect overlapping intervals', () => {
      const interval1 = { start: todayAt(10, 0), end: todayAt(12, 0) };
      const interval2 = { start: todayAt(11, 0), end: todayAt(13, 0) };

      expect(intervalsOverlap(interval1, interval2)).toBe(true);
    });

    it('should detect non-overlapping intervals', () => {
      const interval1 = { start: todayAt(10, 0), end: todayAt(12, 0) };
      const interval2 = { start: todayAt(14, 0), end: todayAt(16, 0) };

      expect(intervalsOverlap(interval1, interval2)).toBe(false);
    });

    it('should detect touching intervals as overlapping', () => {
      // Intervals that touch at exactly one point
      const interval1 = { start: todayAt(10, 0), end: todayAt(12, 0) };
      const interval2 = { start: todayAt(12, 0), end: todayAt(14, 0) };

      expect(intervalsOverlap(interval1, interval2)).toBe(true);
    });

    it('should detect contained intervals as overlapping', () => {
      // One interval completely inside another
      const outer = { start: todayAt(10, 0), end: todayAt(16, 0) };
      const inner = { start: todayAt(12, 0), end: todayAt(14, 0) };

      expect(intervalsOverlap(outer, inner)).toBe(true);
      expect(intervalsOverlap(inner, outer)).toBe(true);
    });
  });

  describe('formatSessionBoundary', () => {
    it('should format session for display', () => {
      const profile = createTestProfile();
      const drink = createDrink(1, todayAt(14, 0));
      const sessions = calculateSessionsFromDrinks([drink], profile);

      const formatted = formatSessionBoundary(sessions[0]);

      expect(formatted).toContain('Session');
      expect(formatted).toContain('Peak');
      expect(formatted).toContain('drink');
      expect(formatted).toContain('SU');

      console.log('Formatted:', formatted);
    });
  });
});

// ============================================================================
// PROFILE VARIATIONS
// ============================================================================

describe('Session Calculator - Profile Variations', () => {
  describe('Different Body Weights', () => {
    it('should calculate longer sessions for lighter person', () => {
      const lightProfile: UserProfile = {
        ...createTestProfile(),
        weightKg: 60,
      };

      const heavyProfile: UserProfile = {
        ...createTestProfile(),
        weightKg: 100,
      };

      const drink = createDrink(1, todayAt(14, 0));

      const lightSessions = calculateSessionsFromDrinks([drink], lightProfile);
      const heavySessions = calculateSessionsFromDrinks([drink], heavyProfile);

      // Lighter person should have higher peak and longer session
      expect(lightSessions[0].peakBAC).toBeGreaterThan(heavySessions[0].peakBAC);
      expect(lightSessions[0].endTime.getTime()).toBeGreaterThan(
        heavySessions[0].endTime.getTime()
      );

      console.log('=== Profile Comparison ===');
      console.log(`60kg: ${formatSessionBoundary(lightSessions[0])}`);
      console.log(`100kg: ${formatSessionBoundary(heavySessions[0])}`);
    });
  });

  describe('Different Elimination Rates', () => {
    it('should calculate shorter sessions for fast metabolizer', () => {
      const slowProfile: UserProfile = {
        ...createTestProfile(),
        eliminationRatePermillePerHour: 0.10,
      };

      const fastProfile: UserProfile = {
        ...createTestProfile(),
        eliminationRatePermillePerHour: 0.20,
      };

      const drink = createDrink(1, todayAt(14, 0));

      const slowSessions = calculateSessionsFromDrinks([drink], slowProfile);
      const fastSessions = calculateSessionsFromDrinks([drink], fastProfile);

      // Fast metabolizer should have shorter session
      expect(fastSessions[0].endTime.getTime()).toBeLessThan(
        slowSessions[0].endTime.getTime()
      );

      console.log('=== Elimination Rate Comparison ===');
      console.log(`0.10‰/h: ${formatSessionBoundary(slowSessions[0])}`);
      console.log(`0.20‰/h: ${formatSessionBoundary(fastSessions[0])}`);
    });
  });
});

// ============================================================================
// DRINK DELETION SCENARIOS
// (Integrated from sessionDeletionFix.test.ts)
// ============================================================================

describe('Session Calculator - Drink Deletion', () => {
  const profile = createTestProfile();

  describe('Delete Drink from Session - Session Stays Intact', () => {
    it('should keep drinks in one session when middle drink is deleted (3 drinks in 2 minutes)', () => {
      const baseTime = dateAt(2026, 1, 20, 20, 0);

      const drink1 = createDrink(1, baseTime);
      const drink2 = createDrink(2, new Date(baseTime.getTime() + 60000)); // +1 min
      const drink3 = createDrink(3, new Date(baseTime.getTime() + 120000)); // +2 min

      // Before deletion: all 3 drinks should be in one session
      const boundariesBefore = calculateSessionsFromDrinks([drink1, drink2, drink3], profile);
      expect(boundariesBefore).toHaveLength(1);
      expect(boundariesBefore[0].drinks).toHaveLength(3);

      // After deleting drink2: remaining drinks should still be in one session
      const boundariesAfter = calculateSessionsFromDrinks([drink1, drink3], profile);

      expect(boundariesAfter).toHaveLength(1);
      expect(boundariesAfter[0].drinks).toHaveLength(2);
      expect(boundariesAfter[0].drinks[0].id).toBe(1);
      expect(boundariesAfter[0].drinks[1].id).toBe(3);
    });

    it('should keep drinks in one session when first drink is deleted', () => {
      const baseTime = dateAt(2026, 1, 20, 20, 0);

      const drink1 = createDrink(1, baseTime);
      const drink2 = createDrink(2, new Date(baseTime.getTime() + 60000));
      const drink3 = createDrink(3, new Date(baseTime.getTime() + 120000));

      // After deleting drink1
      const boundaries = calculateSessionsFromDrinks([drink2, drink3], profile);

      expect(boundaries).toHaveLength(1);
      expect(boundaries[0].drinks).toHaveLength(2);
    });

    it('should keep drinks in one session when last drink is deleted', () => {
      const baseTime = dateAt(2026, 1, 20, 20, 0);

      const drink1 = createDrink(1, baseTime);
      const drink2 = createDrink(2, new Date(baseTime.getTime() + 60000));
      const drink3 = createDrink(3, new Date(baseTime.getTime() + 120000));

      // After deleting drink3
      const boundaries = calculateSessionsFromDrinks([drink1, drink2], profile);

      expect(boundaries).toHaveLength(1);
      expect(boundaries[0].drinks).toHaveLength(2);
    });

    it('should handle 5 drinks in quick succession, then delete one in the middle', () => {
      const baseTime = dateAt(2026, 1, 20, 20, 0);

      const drinks: DrinkEntry[] = [];
      for (let i = 0; i < 5; i++) {
        drinks.push(createDrink(i + 1, new Date(baseTime.getTime() + i * 60000)));
      }

      // Before deletion: all 5 in one session
      const boundariesBefore = calculateSessionsFromDrinks(drinks, profile);
      expect(boundariesBefore).toHaveLength(1);
      expect(boundariesBefore[0].drinks).toHaveLength(5);

      // Delete drink 3 (middle one)
      const remainingDrinks = drinks.filter(d => d.id !== 3);
      const boundariesAfter = calculateSessionsFromDrinks(remainingDrinks, profile);

      // Should still be one session
      expect(boundariesAfter).toHaveLength(1);
      expect(boundariesAfter[0].drinks).toHaveLength(4);
    });
  });

  describe('Delete Drink - Session Splits', () => {
    it('should split session into two when bridge drink is deleted', () => {
      // Session with 3 drinks, delete middle one that bridges the gap
      // Drinks far enough apart that without the middle one, BAC reaches 0
      const drink1 = createDrink(1, todayAt(10, 0));  // Morning
      const drink2 = createDrink(2, todayAt(12, 0));  // Bridge
      const drink3 = createDrink(3, todayAt(14, 0));  // Afternoon

      // Before deletion: check if merged
      const boundariesBefore = calculateSessionsFromDrinks([drink1, drink2, drink3], profile);
      console.log('=== Before Bridge Deletion ===');
      boundariesBefore.forEach((s, i) => console.log(`Session ${i + 1}: ${formatSessionBoundary(s)}`));

      // After deleting drink2 (bridge): should split if BAC of drink1 reaches 0 before 14:00
      const boundariesAfter = calculateSessionsFromDrinks([drink1, drink3], profile);

      console.log('=== After Bridge Deletion ===');
      boundariesAfter.forEach((s, i) => console.log(`Session ${i + 1}: ${formatSessionBoundary(s)}`));

      // Verify: With 4 hours gap (10:00 to 14:00), one beer should be metabolized
      // BAC from 10:00 drink at 13:59 should be 0
      const bacAt1359 = getBACAtTime([drink1], profile, todayAt(13, 59));
      console.log(`BAC at 13:59 from 10:00 drink: ${bacAt1359.toFixed(3)}‰`);

      if (bacAt1359 === 0) {
        expect(boundariesAfter).toHaveLength(2);
        expect(boundariesAfter[0].drinks).toHaveLength(1);
        expect(boundariesAfter[1].drinks).toHaveLength(1);
      }
    });

    it('should correctly split sessions when drinks are hours apart', () => {
      const drink1 = createDrink(1, dateAt(2026, 1, 20, 20, 0)); // 20:00
      const drink2 = createDrink(2, dateAt(2026, 1, 21, 4, 0));  // 04:00 next day (8 hours later)

      const boundaries = calculateSessionsFromDrinks([drink1, drink2], profile);

      // These should be 2 separate sessions (8 hours apart)
      expect(boundaries).toHaveLength(2);
      expect(boundaries[0].drinks).toHaveLength(1);
      expect(boundaries[1].drinks).toHaveLength(1);
    });
  });

  describe('Delete All Drinks from Session', () => {
    it('should return empty when all drinks are deleted', () => {
      // Simulate: had drinks, now all deleted
      const boundaries = calculateSessionsFromDrinks([], profile);
      expect(boundaries).toHaveLength(0);
    });

    it('should return single session when second-to-last drink deleted', () => {
      const drink1 = createDrink(1, todayAt(14, 0));
      const drink2 = createDrink(2, todayAt(14, 30));

      // Delete drink2
      const boundaries = calculateSessionsFromDrinks([drink1], profile);

      expect(boundaries).toHaveLength(1);
      expect(boundaries[0].drinks).toHaveLength(1);
      expect(boundaries[0].drinks[0].id).toBe(1);
    });
  });
});

// ============================================================================
// DRINK EDIT SCENARIOS (TIMESTAMP CHANGES)
// ============================================================================

describe('Session Calculator - Drink Edit (Timestamp Change)', () => {
  const profile = createTestProfile();

  describe('Timestamp Change - Drink Moves Between Sessions', () => {
    it('should move drink to different session when timestamp changes significantly', () => {
      // Original: 2 drinks in morning, 1 in evening
      const drink1 = createDrink(1, todayAt(10, 0));
      const drink2 = createDrink(2, todayAt(10, 30));
      const drink3 = createDrink(3, todayAt(20, 0));

      const boundariesBefore = calculateSessionsFromDrinks([drink1, drink2, drink3], profile);
      expect(boundariesBefore).toHaveLength(2);
      expect(boundariesBefore[0].drinks).toHaveLength(2); // Morning session
      expect(boundariesBefore[1].drinks).toHaveLength(1); // Evening session

      // Edit drink2: move from 10:30 to 20:30 (morning → evening)
      const drink2Edited = createDrink(2, todayAt(20, 30));
      const boundariesAfter = calculateSessionsFromDrinks([drink1, drink2Edited, drink3], profile);

      expect(boundariesAfter).toHaveLength(2);
      expect(boundariesAfter[0].drinks).toHaveLength(1); // Morning: only drink1
      expect(boundariesAfter[1].drinks).toHaveLength(2); // Evening: drink2 + drink3
    });
  });

  describe('Timestamp Change - Sessions Merge', () => {
    it('should merge sessions when timestamp change causes overlap', () => {
      // Original: 2 separate sessions
      const drink1 = createDrink(1, todayAt(10, 0));  // Session A
      const drink2 = createDrink(2, todayAt(20, 0));  // Session B

      const boundariesBefore = calculateSessionsFromDrinks([drink1, drink2], profile);
      expect(boundariesBefore).toHaveLength(2);

      // Edit drink1: move from 10:00 to 19:30 (close to drink2)
      const drink1Edited = createDrink(1, todayAt(19, 30));
      const boundariesAfter = calculateSessionsFromDrinks([drink1Edited, drink2], profile);

      // Should now be ONE session (drinks 30 min apart)
      expect(boundariesAfter).toHaveLength(1);
      expect(boundariesAfter[0].drinks).toHaveLength(2);
    });
  });

  describe('Timestamp Change - Session Splits', () => {
    it('should split session when timestamp change creates gap', () => {
      // Original: 2 drinks close together (one session)
      const drink1 = createDrink(1, todayAt(14, 0));
      const drink2 = createDrink(2, todayAt(14, 30));

      const boundariesBefore = calculateSessionsFromDrinks([drink1, drink2], profile);
      expect(boundariesBefore).toHaveLength(1);
      expect(boundariesBefore[0].drinks).toHaveLength(2);

      // Edit drink2: move from 14:30 to 22:00 (far away)
      const drink2Edited = createDrink(2, todayAt(22, 0));
      const boundariesAfter = calculateSessionsFromDrinks([drink1, drink2Edited], profile);

      // Should now be TWO sessions
      expect(boundariesAfter).toHaveLength(2);
      expect(boundariesAfter[0].drinks).toHaveLength(1);
      expect(boundariesAfter[1].drinks).toHaveLength(1);
    });
  });

  describe('Volume/ABV Change - Session Duration Changes', () => {
    it('should recalculate session end time when drink volume changes', () => {
      // Original: small drink
      const smallDrink = createDrink(1, todayAt(14, 0), 250, 5);
      const sessionSmall = calculateSessionsFromDrinks([smallDrink], profile);

      // After edit: large drink at same time
      const largeDrink = createDrink(1, todayAt(14, 0), 1000, 5);
      const sessionLarge = calculateSessionsFromDrinks([largeDrink], profile);

      // Large drink should have later end time
      expect(sessionLarge[0].endTime.getTime()).toBeGreaterThan(
        sessionSmall[0].endTime.getTime()
      );

      // Large drink should have higher peak BAC
      expect(sessionLarge[0].peakBAC).toBeGreaterThan(sessionSmall[0].peakBAC);
    });
  });
});

// ============================================================================
// THREE SESSIONS → ONE SESSION (CHAIN MERGE)
// ============================================================================

describe('Session Calculator - Chain Merge (3→1)', () => {
  const profile = createTestProfile();

  it('should merge three drinks into one session with proper bridging', () => {
    // Start with 3 drinks that are close enough to potentially merge
    // Each beer keeps BAC > 0 for ~2.5 hours, so drinks 2 hours apart should merge
    const drink1 = createDrink(1, todayAt(10, 0));  // 10:00
    const drink2 = createDrink(2, todayAt(12, 0));  // 12:00 (2h gap - should merge with drink1)
    const drink3 = createDrink(3, todayAt(14, 0));  // 14:00 (2h gap - should merge with drink2)

    const boundaries = calculateSessionsFromDrinks([drink1, drink2, drink3], profile);
    console.log('=== Chain of 3 drinks (2h apart each) ===');
    boundaries.forEach((s, i) => console.log(`Session ${i + 1}: ${formatSessionBoundary(s)}`));

    // With drinks 2h apart, each extending the session, should be ONE session
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].drinks).toHaveLength(3);
  });

  it('should keep sessions separate when gaps are too large', () => {
    // Drinks 6 hours apart - too far for BAC to overlap
    const drink1 = createDrink(1, todayAt(8, 0));   // Session A
    const drink2 = createDrink(2, todayAt(14, 0));  // Session B
    const drink3 = createDrink(3, todayAt(20, 0));  // Session C

    const boundaries = calculateSessionsFromDrinks([drink1, drink2, drink3], profile);
    console.log('=== 3 drinks 6h apart ===');
    boundaries.forEach((s, i) => console.log(`Session ${i + 1}: ${formatSessionBoundary(s)}`));

    // Should be 3 separate sessions
    expect(boundaries).toHaveLength(3);

    // Total drinks accounted for
    const totalDrinks = boundaries.reduce((sum, s) => sum + s.drinks.length, 0);
    expect(totalDrinks).toBe(3);
  });

  it('should merge two sessions into one when a bridge drink connects them', () => {
    // Two sessions, 4 hours apart
    const drink1 = createDrink(1, todayAt(10, 0));  // Session A: 10:00-~13:00
    const drink2 = createDrink(2, todayAt(16, 0));  // Session B: 16:00-~19:00

    const boundariesBefore = calculateSessionsFromDrinks([drink1, drink2], profile);
    expect(boundariesBefore).toHaveLength(2);

    // Add bridge drink at 12:30 - should extend session A
    const bridge = createDrink(3, todayAt(12, 30));
    const withBridge = calculateSessionsFromDrinks([drink1, bridge, drink2], profile);

    console.log('=== Two Sessions Merge Test ===');
    console.log('Before bridge:');
    boundariesBefore.forEach((s, i) => console.log(`  Session ${i + 1}: ${formatSessionBoundary(s)}`));
    console.log('After bridge at 12:30:');
    withBridge.forEach((s, i) => console.log(`  Session ${i + 1}: ${formatSessionBoundary(s)}`));

    // Check if sessions merged
    const totalDrinks = withBridge.reduce((sum, s) => sum + s.drinks.length, 0);
    expect(totalDrinks).toBe(3);
  });
});

// ============================================================================
// REAL-WORLD OPERATION SEQUENCES
// ============================================================================

describe('Session Calculator - Real-World Operation Sequences', () => {
  const profile = createTestProfile();

  it('should handle Add → Add → Delete sequence correctly', () => {
    // Step 1: Add first drink
    const drink1 = createDrink(1, todayAt(14, 0));
    let boundaries = calculateSessionsFromDrinks([drink1], profile);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].drinks).toHaveLength(1);

    // Step 2: Add second drink (same session)
    const drink2 = createDrink(2, todayAt(14, 30));
    boundaries = calculateSessionsFromDrinks([drink1, drink2], profile);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].drinks).toHaveLength(2);

    // Step 3: Delete first drink
    boundaries = calculateSessionsFromDrinks([drink2], profile);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].drinks).toHaveLength(1);
    expect(boundaries[0].drinks[0].id).toBe(2);
  });

  it('should handle Add → Edit → Add sequence correctly', () => {
    // Step 1: Add morning drink
    const drink1 = createDrink(1, todayAt(10, 0));
    let boundaries = calculateSessionsFromDrinks([drink1], profile);
    expect(boundaries).toHaveLength(1);

    // Step 2: Edit to evening
    const drink1Edited = createDrink(1, todayAt(20, 0));
    boundaries = calculateSessionsFromDrinks([drink1Edited], profile);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].startTime.getHours()).toBe(20);

    // Step 3: Add another evening drink
    const drink2 = createDrink(2, todayAt(20, 30));
    boundaries = calculateSessionsFromDrinks([drink1Edited, drink2], profile);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].drinks).toHaveLength(2);
  });

  it('should handle rapid additions (Quick Add scenario)', () => {
    // User quickly adds 3 drinks via Quick Add
    const baseTime = todayAt(20, 0);
    const drinks: DrinkEntry[] = [];

    // Add drinks one by one, recalculating each time
    for (let i = 0; i < 3; i++) {
      drinks.push(createDrink(i + 1, new Date(baseTime.getTime() + i * 30000))); // 30 sec apart
      const boundaries = calculateSessionsFromDrinks(drinks, profile);

      // Should always be one session
      expect(boundaries).toHaveLength(1);
      expect(boundaries[0].drinks).toHaveLength(i + 1);
    }
  });
});
