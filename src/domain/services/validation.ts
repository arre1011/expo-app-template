import { CreateUserProfile, CreateDrinkEntry, CreateDailyGoal } from '../models/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate user profile data
 */
export function validateUserProfile(profile: Partial<CreateUserProfile>): ValidationResult {
  const errors: string[] = [];

  // Weight validation
  if (profile.weightKg === undefined || profile.weightKg === null) {
    errors.push('Weight is required');
  } else if (profile.weightKg <= 0) {
    errors.push('Weight must be greater than 0');
  } else if (profile.weightKg > 300) {
    errors.push('Weight seems unrealistically high');
  }

  // Sex or r-value validation
  if (!profile.sex && !profile.bodyWaterConstantR) {
    errors.push('Please select a biological profile or enter an r-value');
  }

  // Body water constant validation
  if (profile.bodyWaterConstantR !== undefined) {
    if (profile.bodyWaterConstantR <= 0 || profile.bodyWaterConstantR > 1) {
      errors.push('Body water ratio must be between 0 and 1');
    }
  }

  // Elimination rate validation
  if (profile.eliminationRatePermillePerHour !== undefined) {
    if (profile.eliminationRatePermillePerHour <= 0) {
      errors.push('Elimination rate must be greater than 0');
    } else if (profile.eliminationRatePermillePerHour > 0.5) {
      errors.push('Elimination rate seems unrealistically high');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate drink entry data
 */
export function validateDrinkEntry(entry: Partial<CreateDrinkEntry>): ValidationResult {
  const errors: string[] = [];

  // Volume validation
  if (entry.volumeMl === undefined || entry.volumeMl === null) {
    errors.push('Volume is required');
  } else if (entry.volumeMl <= 0) {
    errors.push('Volume must be greater than 0');
  } else if (entry.volumeMl > 5000) {
    errors.push('Volume seems unrealistically high');
  }

  // ABV validation
  if (entry.abvPercent === undefined || entry.abvPercent === null) {
    errors.push('Alcohol content is required');
  } else if (entry.abvPercent <= 0) {
    errors.push('Alcohol content must be greater than 0');
  } else if (entry.abvPercent > 100) {
    errors.push('Alcohol content cannot exceed 100%');
  }

  // Timestamp validation
  if (!entry.timestamp) {
    errors.push('Timestamp is required');
  } else {
    const timestamp = new Date(entry.timestamp);
    if (isNaN(timestamp.getTime())) {
      errors.push('Invalid timestamp');
    }
    // Don't allow drinks too far in the future
    const maxFutureTime = new Date();
    maxFutureTime.setMinutes(maxFutureTime.getMinutes() + 5);
    if (timestamp > maxFutureTime) {
      errors.push('Timestamp cannot be in the future');
    }
  }

  // Type validation
  if (!entry.type) {
    errors.push('Drink type is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate daily goal data
 */
export function validateDailyGoal(goal: Partial<CreateDailyGoal>): ValidationResult {
  const errors: string[] = [];

  // Date validation
  if (!goal.date) {
    errors.push('Date is required');
  }

  // Max BAC validation
  if (goal.maxBAC === undefined || goal.maxBAC === null) {
    errors.push('Maximum BAC limit is required');
  } else if (goal.maxBAC < 0) {
    errors.push('BAC limit cannot be negative');
  } else if (goal.maxBAC > 3.0) {
    errors.push('BAC limit seems unrealistically high');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a profile is complete (has all required fields)
 */
export function isProfileComplete(profile: Partial<CreateUserProfile> | null): boolean {
  if (!profile) return false;

  return (
    profile.weightKg !== undefined &&
    profile.weightKg > 0 &&
    profile.bodyWaterConstantR !== undefined &&
    profile.bodyWaterConstantR > 0 &&
    profile.eliminationRatePermillePerHour !== undefined &&
    profile.eliminationRatePermillePerHour > 0
  );
}
