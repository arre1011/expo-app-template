import {
  calculateAlcoholGrams,
  calculateBACIncrease,
  calculateAbsorptionFactor,
  getAbsorptionMinutes,
  calculateElimination,
  calculateBACTimeSeries,
  formatBAC,
  formatSoberTime,
} from '../src/domain/services/bacCalculator';
import { UserProfile, DrinkEntry } from '../src/domain/models/types';
import { BAC_CONSTANTS } from '../src/domain/constants/defaults';

describe('BAC Calculator', () => {
  describe('calculateAlcoholGrams', () => {
    it('should calculate alcohol grams correctly for beer', () => {
      // 500ml beer at 5% ABV
      // Expected: 500 * 0.05 * 0.789 = 19.725g
      const result = calculateAlcoholGrams(500, 5);
      expect(result).toBeCloseTo(19.725, 2);
    });

    it('should calculate alcohol grams correctly for wine', () => {
      // 200ml wine at 12.5% ABV
      // Expected: 200 * 0.125 * 0.789 = 19.725g
      const result = calculateAlcoholGrams(200, 12.5);
      expect(result).toBeCloseTo(19.725, 2);
    });

    it('should calculate alcohol grams correctly for shot', () => {
      // 40ml spirit at 40% ABV
      // Expected: 40 * 0.4 * 0.789 = 12.624g
      const result = calculateAlcoholGrams(40, 40);
      expect(result).toBeCloseTo(12.624, 2);
    });

    it('should return 0 for non-alcoholic drink', () => {
      const result = calculateAlcoholGrams(330, 0);
      expect(result).toBe(0);
    });

    it('should handle edge cases with 0 volume', () => {
      const result = calculateAlcoholGrams(0, 5);
      expect(result).toBe(0);
    });
  });

  describe('calculateBACIncrease', () => {
    it('should calculate BAC increase for male profile', () => {
      // 20g alcohol, 80kg male (r = 0.68)
      // Expected: 20 / (80 * 0.68) = 0.3676‰
      const result = calculateBACIncrease(20, 80, 0.68);
      expect(result).toBeCloseTo(0.3676, 3);
    });

    it('should calculate BAC increase for female profile', () => {
      // 20g alcohol, 60kg female (r = 0.55)
      // Expected: 20 / (60 * 0.55) = 0.6061‰
      const result = calculateBACIncrease(20, 60, 0.55);
      expect(result).toBeCloseTo(0.6061, 3);
    });

    it('should return 0 for invalid weight', () => {
      const result = calculateBACIncrease(20, 0, 0.68);
      expect(result).toBe(0);
    });

    it('should return 0 for invalid r value', () => {
      const result = calculateBACIncrease(20, 80, 0);
      expect(result).toBe(0);
    });
  });

  describe('getAbsorptionMinutes', () => {
    it('should return 0 for 0 grams', () => {
      expect(getAbsorptionMinutes(0)).toBe(0);
    });

    it('should return 0 for negative grams', () => {
      expect(getAbsorptionMinutes(-10)).toBe(0);
    });

    it('should calculate absorption time based on grams', () => {
      // 20g alcohol / 0.33 g/min = ~60.6 minutes
      const result = getAbsorptionMinutes(20);
      expect(result).toBeCloseTo(60.6, 1);
    });

    it('should calculate shorter absorption for smaller drinks', () => {
      // 13g alcohol (330ml beer) / 0.33 g/min = ~39.4 minutes
      const result = getAbsorptionMinutes(13);
      expect(result).toBeCloseTo(39.4, 1);
    });

    it('should calculate longer absorption for larger drinks', () => {
      // 30g alcohol / 0.33 g/min = ~90.9 minutes
      const result = getAbsorptionMinutes(30);
      expect(result).toBeCloseTo(90.9, 1);
    });
  });

  describe('calculateAbsorptionFactor', () => {
    const testAlcoholGrams = 20; // ~60 min absorption time

    it('should return 0 for negative time', () => {
      const result = calculateAbsorptionFactor(-10, testAlcoholGrams);
      expect(result).toBe(0);
    });

    it('should return 0 at time 0', () => {
      const result = calculateAbsorptionFactor(0, testAlcoholGrams);
      expect(result).toBe(0);
    });

    it('should return 0 for 0 alcohol grams', () => {
      const result = calculateAbsorptionFactor(30, 0);
      expect(result).toBe(0);
    });

    it('should return ~0.5 at half absorption time', () => {
      // 20g → ~60 min absorption, so at 30 min should be ~0.5
      const absorptionMinutes = getAbsorptionMinutes(testAlcoholGrams);
      const result = calculateAbsorptionFactor(absorptionMinutes / 2, testAlcoholGrams);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('should return 1 at full absorption time', () => {
      const absorptionMinutes = getAbsorptionMinutes(testAlcoholGrams);
      const result = calculateAbsorptionFactor(absorptionMinutes, testAlcoholGrams);
      expect(result).toBe(1);
    });

    it('should return 1 after absorption time', () => {
      const absorptionMinutes = getAbsorptionMinutes(testAlcoholGrams);
      const result = calculateAbsorptionFactor(absorptionMinutes + 30, testAlcoholGrams);
      expect(result).toBe(1);
    });

    it('should absorb faster for smaller drinks', () => {
      const smallDrinkGrams = 10; // ~30 min absorption
      const largeDrinkGrams = 30; // ~90 min absorption

      // At 30 minutes:
      const smallResult = calculateAbsorptionFactor(30, smallDrinkGrams);
      const largeResult = calculateAbsorptionFactor(30, largeDrinkGrams);

      // Small drink should be fully absorbed, large drink only ~1/3
      expect(smallResult).toBeCloseTo(1, 1);
      expect(largeResult).toBeCloseTo(0.33, 1);
    });
  });

  describe('calculateElimination', () => {
    it('should calculate elimination correctly', () => {
      // 60 minutes at 0.15‰/hour
      // Expected: 1 * 0.15 = 0.15‰
      const result = calculateElimination(60, 0.15);
      expect(result).toBe(0.15);
    });

    it('should calculate elimination for 2 hours', () => {
      // 120 minutes at 0.15‰/hour
      // Expected: 2 * 0.15 = 0.30‰
      const result = calculateElimination(120, 0.15);
      expect(result).toBe(0.30);
    });

    it('should return 0 for 0 minutes', () => {
      const result = calculateElimination(0, 0.15);
      expect(result).toBe(0);
    });
  });

  describe('calculateBACTimeSeries', () => {
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

    it('should return empty series for no drinks', () => {
      const result = calculateBACTimeSeries([], mockProfile);

      expect(result.dataPoints).toHaveLength(0);
      expect(result.currentBAC).toBe(0);
      expect(result.peakBAC).toBe(0);
      expect(result.peakTime).toBeNull();
      expect(result.soberTime).toBeNull();
    });

    it('should calculate time series for single drink', () => {
      const now = new Date();
      const drinkTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const drinks: DrinkEntry[] = [{
        id: 1,
        timestamp: drinkTime.toISOString(),
        type: 'beer_large',
        volumeMl: 500,
        abvPercent: 5,
        label: 'Test Beer',
        notes: null,
        sessionId: null,
        createdAt: drinkTime.toISOString(),
        updatedAt: drinkTime.toISOString(),
      }];

      const result = calculateBACTimeSeries(drinks, mockProfile);

      expect(result.dataPoints.length).toBeGreaterThan(0);
      expect(result.peakBAC).toBeGreaterThan(0);
      expect(result.currentBAC).toBeGreaterThanOrEqual(0);
    });

    it('should calculate higher BAC for multiple drinks', () => {
      const now = new Date();
      const drink1Time = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const drink2Time = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago

      const singleDrink: DrinkEntry[] = [{
        id: 1,
        timestamp: drink1Time.toISOString(),
        type: 'beer_large',
        volumeMl: 500,
        abvPercent: 5,
        label: null,
        notes: null,
        sessionId: null,
        createdAt: drink1Time.toISOString(),
        updatedAt: drink1Time.toISOString(),
      }];

      const twoDrinks: DrinkEntry[] = [
        ...singleDrink,
        {
          id: 2,
          timestamp: drink2Time.toISOString(),
          type: 'beer_large',
          volumeMl: 500,
          abvPercent: 5,
          label: null,
          notes: null,
          sessionId: null,
          createdAt: drink2Time.toISOString(),
          updatedAt: drink2Time.toISOString(),
        }
      ];

      const singleResult = calculateBACTimeSeries(singleDrink, mockProfile);
      const doubleResult = calculateBACTimeSeries(twoDrinks, mockProfile);

      expect(doubleResult.peakBAC).toBeGreaterThan(singleResult.peakBAC);
    });
  });

  describe('formatBAC', () => {
    it('should format BAC with comma as decimal separator', () => {
      expect(formatBAC(0.45)).toBe('0,45');
      expect(formatBAC(1.2)).toBe('1,20');
      expect(formatBAC(0)).toBe('0,00');
    });
  });

  describe('formatSoberTime', () => {
    it('should return "Sober" for null', () => {
      expect(formatSoberTime(null)).toBe('Sober');
    });

    it('should format time correctly', () => {
      const date = new Date();
      date.setHours(14, 30);
      expect(formatSoberTime(date)).toBe('14:30');
    });

    it('should pad single digit hours and minutes', () => {
      const date = new Date();
      date.setHours(8, 5);
      expect(formatSoberTime(date)).toBe('08:05');
    });
  });

  describe('Realistic BAC values for common scenarios', () => {
    it('should calculate reasonable BAC for one 500ml beer (male profile)', () => {
      // Scenario: 80kg male drinks one 500ml beer with 5.4% ABV
      const profile: UserProfile = {
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

      const now = new Date();
      const drinks: DrinkEntry[] = [{
        id: 1,
        timestamp: now.toISOString(),
        type: 'beer_large',
        volumeMl: 500,
        abvPercent: 5.4,
        label: 'Test Beer',
        notes: null,
        sessionId: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }];

      const result = calculateBACTimeSeries(drinks, profile);

      // For 500ml beer at 5.4% ABV:
      // Alcohol = 500 * 0.054 * 0.789 = 21.3g
      // BAC = 21.3 / (80 * 0.68) = 0.391‰
      // Peak should be around 0.35-0.45‰ (accounting for absorption)
      console.log('Peak BAC for one beer:', result.peakBAC);
      expect(result.peakBAC).toBeGreaterThan(0.2);
      expect(result.peakBAC).toBeLessThan(0.6);
    });

    it('should calculate reasonable BAC for one 500ml beer (female profile)', () => {
      // Scenario: 60kg female drinks one 500ml beer with 5.4% ABV
      const profile: UserProfile = {
        id: 1,
        weightKg: 60,
        sex: 'female',
        bodyWaterConstantR: 0.55,
        eliminationRatePermillePerHour: 0.15,
        weightUnit: 'lb',
        volumeUnit: 'ml',
        bacUnit: 'percent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const now = new Date();
      const drinks: DrinkEntry[] = [{
        id: 1,
        timestamp: now.toISOString(),
        type: 'beer_large',
        volumeMl: 500,
        abvPercent: 5.4,
        label: 'Test Beer',
        notes: null,
        sessionId: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }];

      const result = calculateBACTimeSeries(drinks, profile);

      // For 500ml beer at 5.4% ABV:
      // Alcohol = 500 * 0.054 * 0.789 = 21.3g
      // BAC = 21.3 / (60 * 0.55) = 0.645‰
      // Peak should be around 0.5-0.7‰ (accounting for absorption)
      console.log('Peak BAC for one beer (female):', result.peakBAC);
      expect(result.peakBAC).toBeGreaterThan(0.4);
      expect(result.peakBAC).toBeLessThan(0.8);
    });
  });
});
