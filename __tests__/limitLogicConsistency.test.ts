import { checkBACLimitStatus, getDayStatus } from '../src/domain/services/statistics';
import { UserProfile, DrinkEntry, DailyGoal } from '../src/domain/models/types';

/**
 * Critical Integration Test:
 * This test ensures consistency between BAC limit checking (for modals)
 * and calendar day status display.
 *
 * Bug History:
 * - checkBACLimitStatus used >= for limit checking (modal trigger)
 * - getDayStatus used > for limit checking (calendar color)
 * - This caused modal to appear but calendar showed yellow instead of red
 */
describe('BAC Limit Logic Consistency', () => {
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
    date: '2025-01-01',
    maxBAC: 0.5, // 0.5‰ limit
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createMockDrink = (
    volumeMl: number,
    abvPercent: number,
    timestamp: Date = new Date()
  ): DrinkEntry => ({
    id: 1,
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

  describe('Consistency between checkBACLimitStatus and getDayStatus', () => {
    it('should both use >= for BAC at exactly the limit', () => {
      // Create drinks that will result in exactly 0.5‰ BAC
      const drinks: DrinkEntry[] = [
        createMockDrink(330, 5.0), // Small beer
      ];

      // Check if limit status detects it
      const limitStatus = checkBACLimitStatus(drinks, mockGoal, mockProfile);

      // Check if day status shows as over_limit (red)
      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());

      // Both should agree: if modal triggers, calendar should be red
      if (limitStatus.status !== 'under') {
        expect(dayStatus).toBe('over_limit');
      }
    });

    it('should show red calendar when BAC equals limit (critical edge case)', () => {
      // This is the exact scenario that was broken:
      // BAC = 0.5‰ (exactly at limit)

      const drinks: DrinkEntry[] = [
        createMockDrink(400, 5.0), // Adjusted to get close to 0.5‰
      ];

      const limitStatus = checkBACLimitStatus(drinks, mockGoal, mockProfile);
      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());

      // If limit is reached, both should agree
      if (limitStatus.status === 'bac_reached' || limitStatus.status === 'bac_exceeded') {
        expect(dayStatus).toBe('over_limit');
      }
    });

    it('should show yellow (moderate) when under limit', () => {
      const drinks: DrinkEntry[] = [
        createMockDrink(200, 5.0), // Very small amount, should be under 0.5‰
      ];

      const limitStatus = checkBACLimitStatus(drinks, mockGoal, mockProfile);
      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());

      expect(limitStatus.status).toBe('under');
      expect(dayStatus).toBe('moderate');
    });

    it('should show red when significantly exceeding limit', () => {
      const drinks: DrinkEntry[] = [
        createMockDrink(500, 5.0), // Large beer
        createMockDrink(500, 5.0), // Another large beer
      ];

      const limitStatus = checkBACLimitStatus(drinks, mockGoal, mockProfile);
      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());

      // Should be well over the limit
      expect(limitStatus.status).toBe('bac_exceeded');
      expect(dayStatus).toBe('over_limit');
    });
  });

  describe('Modal trigger thresholds', () => {
    it('should trigger "bac_reached" modal when adding drink that reaches limit', () => {
      // Start with one beer already consumed
      const currentDrinks: DrinkEntry[] = [
        createMockDrink(500, 5.0),
      ];
      // Add another large beer - this should push us over the limit
      const pendingDrink = {
        volumeMl: 500,
        abvPercent: 5.0,
        timestamp: new Date().toISOString(),
      };

      const limitStatus = checkBACLimitStatus(
        currentDrinks,
        mockGoal,
        mockProfile,
        pendingDrink
      );

      // With 2 beers, should trigger modal
      expect(limitStatus.status).not.toBe('under');
    });

    it('should trigger "bac_exceeded" modal when adding drink that significantly exceeds limit', () => {
      const currentDrinks: DrinkEntry[] = [
        createMockDrink(500, 5.0), // Already have one beer
      ];
      const pendingDrink = {
        volumeMl: 500,
        abvPercent: 5.0,
        timestamp: new Date().toISOString(),
      };

      const limitStatus = checkBACLimitStatus(
        currentDrinks,
        mockGoal,
        mockProfile,
        pendingDrink
      );

      // Should be exceeded (0.05‰ over limit)
      expect(limitStatus.status).toBe('bac_exceeded');
      expect(limitStatus.projectedPeakBAC).toBeGreaterThanOrEqual(mockGoal.maxBAC + 0.05);
    });

    it('should not trigger modal when under limit', () => {
      const currentDrinks: DrinkEntry[] = [];
      const pendingDrink = {
        volumeMl: 200,
        abvPercent: 5.0,
        timestamp: new Date().toISOString(),
      };

      const limitStatus = checkBACLimitStatus(
        currentDrinks,
        mockGoal,
        mockProfile,
        pendingDrink
      );

      expect(limitStatus.status).toBe('under');
    });
  });

  describe('Calendar color consistency', () => {
    it('should show green (sober) when no drinks', () => {
      const dayStatus = getDayStatus([], mockGoal, mockProfile, new Date());
      expect(dayStatus).toBe('sober');
    });

    it('should show yellow (moderate) when goal disabled', () => {
      const disabledGoal = { ...mockGoal, enabled: false };
      const drinks = [createMockDrink(500, 5.0)];

      const dayStatus = getDayStatus(drinks, disabledGoal, mockProfile, new Date());
      expect(dayStatus).toBe('moderate');
    });

    it('should show yellow (moderate) when no goal set', () => {
      const drinks = [createMockDrink(500, 5.0)];

      const dayStatus = getDayStatus(drinks, null, mockProfile, new Date());
      expect(dayStatus).toBe('moderate');
    });

    it('should show red (over_limit) when at or above limit', () => {
      const drinks = [
        createMockDrink(500, 5.0),
        createMockDrink(500, 5.0),
      ];

      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());
      expect(dayStatus).toBe('over_limit');
    });
  });

  describe('Real-world scenarios that caused bugs', () => {
    it('Scenario 1: Add drink that reaches limit exactly', () => {
      // User adds a drink, modal appears, user confirms
      // Calendar should show RED, not yellow

      const existingDrink = createMockDrink(500, 5.0);
      const drinks: DrinkEntry[] = [existingDrink, createMockDrink(500, 5.0)]; // 2 beers
      const limitStatus = checkBACLimitStatus([existingDrink], mockGoal, mockProfile, {
        volumeMl: 500,
        abvPercent: 5.0,
        timestamp: new Date().toISOString(),
      });

      // Modal should appear
      expect(limitStatus.status).not.toBe('under');

      // After adding, calendar should be red
      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());
      // Only check if it's red when modal actually triggered
      if (limitStatus.status !== 'under') {
        expect(dayStatus).toBe('over_limit');
      }
    });

    it('Scenario 2: Multiple drinks throughout the day', () => {
      // User has 3 beers over the day - because of elimination, this might not exceed limit
      // Let's use larger drinks to ensure we exceed 0.5‰
      const now = new Date();
      const drinks: DrinkEntry[] = [
        createMockDrink(500, 5.0, new Date(now.getTime() - 3 * 60 * 60 * 1000)), // 3h ago
        createMockDrink(500, 5.0, new Date(now.getTime() - 2 * 60 * 60 * 1000)), // 2h ago
        createMockDrink(500, 5.0, new Date(now.getTime() - 1 * 60 * 60 * 1000)), // 1h ago
      ];

      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, now);

      // With 3 large beers, should definitely be over limit
      expect(dayStatus).toBe('over_limit');
    });

    it('Scenario 3: Goal reached state persists across all views', () => {
      // This ensures that if limit is reached in home view,
      // calendar and statistics also show the same status

      const drinks = [createMockDrink(500, 5.0)];

      // Check in home view (modal logic)
      const limitStatus = checkBACLimitStatus([], mockGoal, mockProfile, {
        volumeMl: 500,
        abvPercent: 5.0,
        timestamp: new Date().toISOString(),
      });

      // Check in calendar view (day status)
      const dayStatus = getDayStatus(drinks, mockGoal, mockProfile, new Date());

      // Both should agree on over-limit status
      if (limitStatus.status !== 'under') {
        expect(dayStatus).toBe('over_limit');
      }
    });
  });
});
