/**
 * Weight conversion utilities for kg <-> lb
 */

import { WeightUnit } from '../models/types';
export { WeightUnit };

// Conversion factors
export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;

// Valid weight ranges
export const WEIGHT_RANGE_KG = { min: 30, max: 300 } as const;
export const WEIGHT_RANGE_LB = { min: 66, max: 661 } as const;

/**
 * Convert kilograms to pounds
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB);
}

/**
 * Convert pounds to kilograms
 */
export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG);
}

/**
 * Get the valid weight range for a unit
 */
export function getWeightRange(unit: WeightUnit): { min: number; max: number } {
  return unit === 'kg' ? WEIGHT_RANGE_KG : WEIGHT_RANGE_LB;
}

/**
 * Convert weight value when switching units
 * Returns the equivalent value in the new unit
 */
export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'kg' ? kgToLb(value) : lbToKg(value);
}

/**
 * Format weight with unit for display
 */
export function formatWeight(value: number, unit: WeightUnit): string {
  return `${value} ${unit}`;
}

/**
 * Generate array of weight values for picker
 */
export function generateWeightValues(unit: WeightUnit): number[] {
  const range = getWeightRange(unit);
  const values: number[] = [];
  for (let i = range.min; i <= range.max; i++) {
    values.push(i);
  }
  return values;
}

/**
 * Clamp a weight value to the valid range for a unit
 */
export function clampWeight(value: number, unit: WeightUnit): number {
  const range = getWeightRange(unit);
  return Math.max(range.min, Math.min(range.max, value));
}

/**
 * Validate if a weight is within valid range for a unit
 */
export function isValidWeight(value: number, unit: WeightUnit): boolean {
  const range = getWeightRange(unit);
  return value >= range.min && value <= range.max;
}
