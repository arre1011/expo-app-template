/**
 * Tests for weight conversion utilities
 */

import {
  kgToLb,
  lbToKg,
  getWeightRange,
  convertWeight,
  formatWeight,
  generateWeightValues,
  clampWeight,
  isValidWeight,
  WEIGHT_RANGE_KG,
  WEIGHT_RANGE_LB,
} from '../src/domain/utils/weightConversion';

describe('Weight Conversion Utilities', () => {
  describe('kgToLb', () => {
    it('should convert 75 kg to approximately 165 lb', () => {
      expect(kgToLb(75)).toBe(165);
    });

    it('should convert 30 kg to approximately 66 lb', () => {
      expect(kgToLb(30)).toBe(66);
    });

    it('should convert 300 kg to approximately 661 lb', () => {
      expect(kgToLb(300)).toBe(661);
    });

    it('should round to nearest integer', () => {
      expect(kgToLb(50)).toBe(110);
    });
  });

  describe('lbToKg', () => {
    it('should convert 165 lb to approximately 75 kg', () => {
      expect(lbToKg(165)).toBe(75);
    });

    it('should convert 66 lb to approximately 30 kg', () => {
      expect(lbToKg(66)).toBe(30);
    });

    it('should convert 661 lb to approximately 300 kg', () => {
      expect(lbToKg(661)).toBe(300);
    });

    it('should round to nearest integer', () => {
      expect(lbToKg(110)).toBe(50);
    });
  });

  describe('conversion roundtrip', () => {
    it('should be approximately reversible for kg values', () => {
      const originalKg = 75;
      const lb = kgToLb(originalKg);
      const backToKg = lbToKg(lb);
      // Allow 1 kg tolerance due to rounding
      expect(Math.abs(backToKg - originalKg)).toBeLessThanOrEqual(1);
    });

    it('should be approximately reversible for lb values', () => {
      const originalLb = 165;
      const kg = lbToKg(originalLb);
      const backToLb = kgToLb(kg);
      // Allow 1 lb tolerance due to rounding
      expect(Math.abs(backToLb - originalLb)).toBeLessThanOrEqual(1);
    });
  });

  describe('getWeightRange', () => {
    it('should return kg range for kg unit', () => {
      expect(getWeightRange('kg')).toEqual(WEIGHT_RANGE_KG);
    });

    it('should return lb range for lb unit', () => {
      expect(getWeightRange('lb')).toEqual(WEIGHT_RANGE_LB);
    });
  });

  describe('convertWeight', () => {
    it('should return same value when units are the same', () => {
      expect(convertWeight(75, 'kg', 'kg')).toBe(75);
      expect(convertWeight(165, 'lb', 'lb')).toBe(165);
    });

    it('should convert kg to lb', () => {
      expect(convertWeight(75, 'kg', 'lb')).toBe(165);
    });

    it('should convert lb to kg', () => {
      expect(convertWeight(165, 'lb', 'kg')).toBe(75);
    });
  });

  describe('formatWeight', () => {
    it('should format kg correctly', () => {
      expect(formatWeight(75, 'kg')).toBe('75 kg');
    });

    it('should format lb correctly', () => {
      expect(formatWeight(165, 'lb')).toBe('165 lb');
    });
  });

  describe('generateWeightValues', () => {
    it('should generate kg values from 30 to 300', () => {
      const values = generateWeightValues('kg');
      expect(values[0]).toBe(30);
      expect(values[values.length - 1]).toBe(300);
      expect(values.length).toBe(271); // 300 - 30 + 1
    });

    it('should generate lb values from 66 to 661', () => {
      const values = generateWeightValues('lb');
      expect(values[0]).toBe(66);
      expect(values[values.length - 1]).toBe(661);
      expect(values.length).toBe(596); // 661 - 66 + 1
    });
  });

  describe('clampWeight', () => {
    it('should clamp kg values to valid range', () => {
      expect(clampWeight(20, 'kg')).toBe(30);
      expect(clampWeight(350, 'kg')).toBe(300);
      expect(clampWeight(75, 'kg')).toBe(75);
    });

    it('should clamp lb values to valid range', () => {
      expect(clampWeight(50, 'lb')).toBe(66);
      expect(clampWeight(700, 'lb')).toBe(661);
      expect(clampWeight(165, 'lb')).toBe(165);
    });
  });

  describe('isValidWeight', () => {
    it('should validate kg values correctly', () => {
      expect(isValidWeight(30, 'kg')).toBe(true);
      expect(isValidWeight(300, 'kg')).toBe(true);
      expect(isValidWeight(75, 'kg')).toBe(true);
      expect(isValidWeight(29, 'kg')).toBe(false);
      expect(isValidWeight(301, 'kg')).toBe(false);
    });

    it('should validate lb values correctly', () => {
      expect(isValidWeight(66, 'lb')).toBe(true);
      expect(isValidWeight(661, 'lb')).toBe(true);
      expect(isValidWeight(165, 'lb')).toBe(true);
      expect(isValidWeight(65, 'lb')).toBe(false);
      expect(isValidWeight(662, 'lb')).toBe(false);
    });
  });

  describe('unit switching scenario', () => {
    it('should correctly convert when user switches from lb to kg', () => {
      // User has 165 lb selected, switches to kg
      const displayValueLb = 165;
      const internalKg = lbToKg(displayValueLb); // 75 kg
      expect(internalKg).toBe(75);
      // Display should now show 75 kg
      expect(formatWeight(internalKg, 'kg')).toBe('75 kg');
    });

    it('should correctly convert when user switches from kg to lb', () => {
      // User has 75 kg selected, switches to lb
      const displayValueKg = 75;
      const internalKg = displayValueKg; // stays 75 kg
      const displayValueLb = kgToLb(internalKg); // 165 lb
      expect(displayValueLb).toBe(165);
      // Display should now show 165 lb
      expect(formatWeight(displayValueLb, 'lb')).toBe('165 lb');
    });
  });
});
