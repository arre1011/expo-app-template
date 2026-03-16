/**
 * Unit tests for volume conversion utilities (ml <-> oz)
 */

import {
  mlToOz,
  ozToMl,
  convertVolume,
  formatVolume,
  formatVolumeCompact,
  parseVolumeInput,
  volumeForDisplay,
  isValidVolume,
  getVolumeUnitLabel,
  ML_TO_OZ,
  OZ_TO_ML,
} from '../src/domain/utils/volumeConversion';

describe('Volume Conversion', () => {
  describe('mlToOz', () => {
    it('should convert common ml values to oz correctly', () => {
      // 330ml (small beer) ≈ 11.2 oz
      expect(mlToOz(330)).toBeCloseTo(11.2, 1);

      // 500ml (large beer) ≈ 16.9 oz
      expect(mlToOz(500)).toBeCloseTo(16.9, 1);

      // 150ml (wine) ≈ 5.1 oz
      expect(mlToOz(150)).toBeCloseTo(5.1, 1);

      // 40ml (shot) ≈ 1.4 oz
      expect(mlToOz(40)).toBeCloseTo(1.4, 1);
    });

    it('should return 0 for 0 ml', () => {
      expect(mlToOz(0)).toBe(0);
    });
  });

  describe('ozToMl', () => {
    it('should convert common oz values to ml correctly', () => {
      // 12 oz ≈ 355 ml
      expect(ozToMl(12)).toBeCloseTo(355, 0);

      // 5 oz ≈ 148 ml
      expect(ozToMl(5)).toBeCloseTo(148, 0);

      // 1.5 oz (standard shot) ≈ 44 ml
      expect(ozToMl(1.5)).toBeCloseTo(44, 0);
    });

    it('should return 0 for 0 oz', () => {
      expect(ozToMl(0)).toBe(0);
    });
  });

  describe('convertVolume', () => {
    it('should return same value when units are the same', () => {
      expect(convertVolume(330, 'ml', 'ml')).toBe(330);
      expect(convertVolume(11, 'oz', 'oz')).toBe(11);
    });

    it('should convert ml to oz', () => {
      expect(convertVolume(330, 'ml', 'oz')).toBeCloseTo(11.2, 1);
    });

    it('should convert oz to ml', () => {
      expect(convertVolume(11, 'oz', 'ml')).toBeCloseTo(325, 0);
    });
  });

  describe('formatVolume', () => {
    it('should format ml values correctly', () => {
      expect(formatVolume(330, 'ml')).toBe('330 ml');
      expect(formatVolume(500, 'ml')).toBe('500 ml');
    });

    it('should format large ml values as liters', () => {
      expect(formatVolume(1000, 'ml')).toBe('1.0 L');
      expect(formatVolume(1500, 'ml')).toBe('1.5 L');
    });

    it('should format ml values as oz when unit is oz', () => {
      expect(formatVolume(330, 'oz')).toBe('11.2 oz');
      expect(formatVolume(500, 'oz')).toBe('16.9 oz');
    });
  });

  describe('formatVolumeCompact', () => {
    it('should format without spaces for ml', () => {
      expect(formatVolumeCompact(330, 'ml')).toBe('330ml');
      expect(formatVolumeCompact(1000, 'ml')).toBe('1.0L');
    });

    it('should format without spaces for oz', () => {
      expect(formatVolumeCompact(330, 'oz')).toBe('11.2oz');
    });
  });

  describe('parseVolumeInput', () => {
    it('should parse ml input and return ml', () => {
      expect(parseVolumeInput('330', 'ml')).toBe(330);
      expect(parseVolumeInput('500', 'ml')).toBe(500);
    });

    it('should parse oz input and convert to ml', () => {
      const result = parseVolumeInput('11', 'oz');
      expect(result).toBeCloseTo(325, 0);
    });

    it('should return null for invalid input', () => {
      expect(parseVolumeInput('', 'ml')).toBeNull();
      expect(parseVolumeInput('abc', 'ml')).toBeNull();
      expect(parseVolumeInput('-5', 'ml')).toBeNull();
      expect(parseVolumeInput('0', 'ml')).toBeNull();
    });
  });

  describe('volumeForDisplay', () => {
    it('should return ml value unchanged for ml unit', () => {
      expect(volumeForDisplay(330, 'ml')).toBe(330);
    });

    it('should convert ml to oz for oz unit', () => {
      expect(volumeForDisplay(330, 'oz')).toBeCloseTo(11.2, 1);
    });
  });

  describe('isValidVolume', () => {
    it('should validate ml range', () => {
      expect(isValidVolume(10, 'ml')).toBe(true);
      expect(isValidVolume(330, 'ml')).toBe(true);
      expect(isValidVolume(2000, 'ml')).toBe(true);
      expect(isValidVolume(5, 'ml')).toBe(false);
      expect(isValidVolume(2500, 'ml')).toBe(false);
    });

    it('should validate oz range', () => {
      expect(isValidVolume(0.5, 'oz')).toBe(true);
      expect(isValidVolume(11, 'oz')).toBe(true);
      expect(isValidVolume(67, 'oz')).toBe(true);
      expect(isValidVolume(0.3, 'oz')).toBe(false);
      expect(isValidVolume(70, 'oz')).toBe(false);
    });
  });

  describe('getVolumeUnitLabel', () => {
    it('should return correct labels', () => {
      expect(getVolumeUnitLabel('ml')).toBe('ml');
      expect(getVolumeUnitLabel('oz')).toBe('oz');
    });
  });

  describe('Conversion constants', () => {
    it('should have correct conversion factors', () => {
      // 1 oz = 29.5735 ml
      expect(OZ_TO_ML).toBeCloseTo(29.5735, 4);

      // 1 ml = 0.033814 oz
      expect(ML_TO_OZ).toBeCloseTo(0.033814, 5);
    });

    it('should be inverses of each other', () => {
      // Converting back and forth should give approximately the original value
      const originalMl = 330;
      const oz = originalMl * ML_TO_OZ;
      const backToMl = oz * OZ_TO_ML;
      expect(backToMl).toBeCloseTo(originalMl, 0);
    });
  });
});
