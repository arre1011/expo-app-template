/**
 * Volume conversion utilities for ml <-> oz (US fluid ounces)
 */

import { VolumeUnit } from '../models/types';

export type { VolumeUnit };

// Conversion factors
export const ML_TO_OZ = 0.033814;
export const OZ_TO_ML = 29.5735;

// Valid volume ranges
export const VOLUME_RANGE_ML = { min: 10, max: 2000 } as const;
export const VOLUME_RANGE_OZ = { min: 0.5, max: 67 } as const;

/**
 * Convert milliliters to fluid ounces
 */
export function mlToOz(ml: number): number {
  return Math.round(ml * ML_TO_OZ * 10) / 10; // Round to 1 decimal
}

/**
 * Convert fluid ounces to milliliters
 */
export function ozToMl(oz: number): number {
  return Math.round(oz * OZ_TO_ML);
}

/**
 * Get the valid volume range for a unit
 */
export function getVolumeRange(unit: VolumeUnit): { min: number; max: number } {
  return unit === 'ml' ? VOLUME_RANGE_ML : VOLUME_RANGE_OZ;
}

/**
 * Convert volume value when switching units
 * Returns the equivalent value in the new unit
 */
export function convertVolume(value: number, fromUnit: VolumeUnit, toUnit: VolumeUnit): number {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'ml' ? mlToOz(value) : ozToMl(value);
}

/**
 * Format volume with unit for display
 * For ml: shows "330 ml" or "1.5 L" for large volumes
 * For oz: shows "11.2 oz"
 */
export function formatVolume(valueMl: number, unit: VolumeUnit): string {
  if (unit === 'oz') {
    const oz = mlToOz(valueMl);
    return `${oz} oz`;
  }
  // For ml, show liters for large volumes
  if (valueMl >= 1000) {
    return `${(valueMl / 1000).toFixed(1)} L`;
  }
  return `${valueMl} ml`;
}

/**
 * Format volume for compact display (no space)
 */
export function formatVolumeCompact(valueMl: number, unit: VolumeUnit): string {
  if (unit === 'oz') {
    const oz = mlToOz(valueMl);
    return `${oz}oz`;
  }
  if (valueMl >= 1000) {
    return `${(valueMl / 1000).toFixed(1)}L`;
  }
  return `${valueMl}ml`;
}

/**
 * Get volume unit label for input fields
 */
export function getVolumeUnitLabel(unit: VolumeUnit): string {
  return unit === 'ml' ? 'ml' : 'oz';
}

/**
 * Parse user input and convert to ml for storage
 */
export function parseVolumeInput(value: string, unit: VolumeUnit): number | null {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) return null;
  return unit === 'ml' ? parsed : ozToMl(parsed);
}

/**
 * Convert ml value from storage to display value in user's unit
 */
export function volumeForDisplay(valueMl: number, unit: VolumeUnit): number {
  if (unit === 'ml') return valueMl;
  return mlToOz(valueMl);
}

/**
 * Validate if a volume is within valid range for a unit
 */
export function isValidVolume(value: number, unit: VolumeUnit): boolean {
  const range = getVolumeRange(unit);
  return value >= range.min && value <= range.max;
}

/**
 * Get display volume for a drink from catalog
 * Uses natural regional sizes (volumeOz) when available for oz users,
 * falls back to mathematical conversion if not available
 */
export function getDrinkDisplayVolume(
  volumeMl: number,
  volumeOz: number | undefined,
  unit: VolumeUnit
): number {
  if (unit === 'ml') return volumeMl;
  // For oz: use natural oz value if available, otherwise convert
  return volumeOz !== undefined ? volumeOz : mlToOz(volumeMl);
}
