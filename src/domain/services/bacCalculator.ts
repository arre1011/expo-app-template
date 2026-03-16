import { DrinkEntry, UserProfile, BACTimeSeries, BACDataPoint } from '../models/types';
import { BAC_CONSTANTS, STANDARD_UNIT_CONSTANTS } from '../constants/defaults';

/**
 * Calculate grams of pure alcohol in a drink
 * Formula: volumeMl * (abvPercent/100) * 0.789 g/ml
 */
export function calculateAlcoholGrams(volumeMl: number, abvPercent: number): number {
  return volumeMl * (abvPercent / 100) * BAC_CONSTANTS.ETHANOL_DENSITY;
}

/**
 * Calculate the BAC increase from a given amount of alcohol
 * Using simplified Widmark formula: BAC = grams / (weightKg * r)
 * Returns BAC in permille (‰)
 */
export function calculateBACIncrease(
  alcoholGrams: number,
  weightKg: number,
  bodyWaterConstantR: number
): number {
  if (weightKg <= 0 || bodyWaterConstantR <= 0) {
    return 0;
  }
  return alcoholGrams / (weightKg * bodyWaterConstantR);
}

/**
 * Calculate absorption time in minutes based on alcohol grams
 * More alcohol = longer absorption time
 * Formula: absorptionMinutes = alcoholGrams / ABSORPTION_GRAMS_PER_MINUTE
 */
export function getAbsorptionMinutes(alcoholGrams: number): number {
  if (alcoholGrams <= 0) {
    return 0;
  }
  return alcoholGrams / BAC_CONSTANTS.ABSORPTION_GRAMS_PER_MINUTE;
}

/**
 * Calculate the absorption factor at a given time after drinking
 * Linear absorption over dynamically calculated time based on alcohol grams
 * Returns value between 0 and 1
 */
export function calculateAbsorptionFactor(
  minutesSinceDrink: number,
  alcoholGrams: number
): number {
  if (minutesSinceDrink <= 0 || alcoholGrams <= 0) {
    return 0;
  }
  const absorptionMinutes = getAbsorptionMinutes(alcoholGrams);
  if (minutesSinceDrink >= absorptionMinutes) {
    return 1;
  }
  return minutesSinceDrink / absorptionMinutes;
}

/**
 * Calculate the elimination amount at a given time
 * Linear elimination at eliminationRatePermillePerHour
 */
export function calculateElimination(
  minutesSinceStart: number,
  eliminationRatePermillePerHour: number
): number {
  const hours = minutesSinceStart / 60;
  return hours * eliminationRatePermillePerHour;
}

/**
 * Calculate BAC contribution from a single drink at a given time
 */
export function calculateDrinkBACContribution(
  drink: DrinkEntry,
  atTime: Date,
  profile: UserProfile
): number {
  const drinkTime = new Date(drink.timestamp);
  const minutesSinceDrink = (atTime.getTime() - drinkTime.getTime()) / (1000 * 60);

  if (minutesSinceDrink < 0) {
    // Drink is in the future
    return 0;
  }

  const alcoholGrams = calculateAlcoholGrams(drink.volumeMl, drink.abvPercent);
  const maxBAC = calculateBACIncrease(alcoholGrams, profile.weightKg, profile.bodyWaterConstantR);
  const absorptionFactor = calculateAbsorptionFactor(minutesSinceDrink, alcoholGrams);

  return maxBAC * absorptionFactor;
}

/**
 * Calculate the complete BAC time series for a set of drinks
 */
export function calculateBACTimeSeries(
  drinks: DrinkEntry[],
  profile: UserProfile,
  startTime?: Date,
  horizonHours: number = BAC_CONSTANTS.HORIZON_HOURS
): BACTimeSeries {
  if (drinks.length === 0) {
    return {
      dataPoints: [],
      currentBAC: 0,
      peakBAC: 0,
      peakTime: null,
      soberTime: null,
    };
  }

  // Sort drinks by timestamp
  const sortedDrinks = [...drinks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Determine start time (earliest drink or provided start time)
  const earliestDrink = new Date(sortedDrinks[0].timestamp);
  const start = startTime && startTime < earliestDrink ? startTime : earliestDrink;

  // End time is now + horizon
  const now = new Date();
  const end = new Date(now.getTime() + horizonHours * 60 * 60 * 1000);

  const dataPoints: BACDataPoint[] = [];
  let peakBAC = 0;
  let peakTime: Date | null = null;
  let soberTime: Date | null = null;
  let currentBAC = 0;

  // Track when positive BAC started (for elimination calculation)
  let eliminationStartTime: Date | null = null;

  // Generate time series in minute steps
  const timeStepMs = BAC_CONSTANTS.TIME_STEP_MINUTES * 60 * 1000;
  let currentTime = new Date(start);

  while (currentTime <= end) {
    // Sum up all drink contributions at this time
    let totalAbsorbedBAC = 0;
    for (const drink of sortedDrinks) {
      totalAbsorbedBAC += calculateDrinkBACContribution(drink, currentTime, profile);
    }

    // Calculate elimination
    // Elimination only starts after first alcohol is absorbed
    let elimination = 0;
    if (totalAbsorbedBAC > 0) {
      if (eliminationStartTime === null) {
        eliminationStartTime = currentTime;
      }
      const minutesSinceEliminationStart =
        (currentTime.getTime() - eliminationStartTime.getTime()) / (1000 * 60);
      elimination = calculateElimination(
        minutesSinceEliminationStart,
        profile.eliminationRatePermillePerHour
      );
    }

    // Net BAC = absorbed - eliminated, but never negative
    const bac = Math.max(0, totalAbsorbedBAC - elimination);

    dataPoints.push({
      timestamp: new Date(currentTime),
      bac: Math.round(bac * 1000) / 1000, // Round to 3 decimal places
    });

    // Track peak
    if (bac > peakBAC) {
      peakBAC = bac;
      peakTime = new Date(currentTime);
    }

    // Track current BAC (closest to now) - must be before early-exit check
    if (currentTime <= now) {
      currentBAC = bac;
    }

    // Track sober time (first time BAC goes to 0 after being positive)
    if (soberTime === null && peakBAC > 0 && bac === 0) {
      soberTime = new Date(currentTime);
      // Early exit: BAC stays at 0 after this point.
      // Avoids iterating up to (now + 18h) for historical drinks —
      // a drink from 1 year ago would otherwise generate ~526k iterations.
      break;
    }

    currentTime = new Date(currentTime.getTime() + timeStepMs);
  }

  return {
    dataPoints,
    currentBAC: Math.round(currentBAC * 100) / 100, // Round to 2 decimal places for display
    peakBAC: Math.round(peakBAC * 100) / 100,
    peakTime,
    soberTime,
  };
}

/**
 * Get BAC at a specific time
 */
export function getBACAtTime(
  drinks: DrinkEntry[],
  profile: UserProfile,
  atTime: Date
): number {
  if (drinks.length === 0) return 0;

  const sortedDrinks = [...drinks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalAbsorbedBAC = 0;
  for (const drink of sortedDrinks) {
    totalAbsorbedBAC += calculateDrinkBACContribution(drink, atTime, profile);
  }

  // Find elimination start time
  let eliminationStartTime: Date | null = null;
  const earliestDrink = new Date(sortedDrinks[0].timestamp);

  // Simple approximation: elimination starts after absorption begins
  const absorptionStartTime = new Date(earliestDrink.getTime() + BAC_CONSTANTS.TIME_STEP_MINUTES * 60 * 1000);
  if (atTime > absorptionStartTime) {
    eliminationStartTime = absorptionStartTime;
  }

  let elimination = 0;
  if (eliminationStartTime && totalAbsorbedBAC > 0) {
    const minutesSinceEliminationStart =
      (atTime.getTime() - eliminationStartTime.getTime()) / (1000 * 60);
    elimination = calculateElimination(
      Math.max(0, minutesSinceEliminationStart),
      profile.eliminationRatePermillePerHour
    );
  }

  return Math.max(0, Math.round((totalAbsorbedBAC - elimination) * 100) / 100);
}

/**
 * Calculate when BAC will reach zero (sober time)
 */
export function calculateSoberTime(
  drinks: DrinkEntry[],
  profile: UserProfile
): Date | null {
  const timeSeries = calculateBACTimeSeries(drinks, profile);
  return timeSeries.soberTime;
}

/**
 * Format BAC value for display
 */
export function formatBAC(bac: number): string {
  return bac.toFixed(2).replace('.', ',');
}

/**
 * Format time for "sober at" display
 */
export function formatSoberTime(soberTime: Date | null): string {
  if (!soberTime) {
    return 'Sober';
  }
  const hours = soberTime.getHours().toString().padStart(2, '0');
  const minutes = soberTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Filter drinks to only include those from the current "drinking session"
 * A session starts when BAC goes above 0 and ends when it returns to 0.
 * This function finds the last time BAC was 0 and returns all drinks since then.
 */
export function filterDrinksToCurrentSession(
  drinks: DrinkEntry[],
  profile: UserProfile
): DrinkEntry[] {
  if (drinks.length === 0) {
    return [];
  }

  // Sort drinks by timestamp (oldest first)
  const sortedDrinks = [...drinks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const now = new Date();

  // Check if there are recent drinks still being absorbed (within their absorption window)
  // These should be included in the session even if BAC hasn't risen yet
  const recentDrinks = sortedDrinks.filter(d => {
    const drinkTime = new Date(d.timestamp);
    const timeSinceDrinkMs = now.getTime() - drinkTime.getTime();
    // Calculate absorption window based on drink's alcohol content
    const alcoholGrams = calculateAlcoholGrams(d.volumeMl, d.abvPercent);
    const absorptionWindowMs = getAbsorptionMinutes(alcoholGrams) * 60 * 1000;
    // Include drinks from the past that are still being absorbed, or future drinks
    return timeSinceDrinkMs < absorptionWindowMs || drinkTime > now;
  });

  // Work backwards through drinks to find where the current session started
  // We need to find the last point where BAC was 0 before now

  // Start by checking if we're currently sober (no active session)
  const currentBAC = getBACAtTime(sortedDrinks, profile, now);
  if (currentBAC === 0) {
    // Check if there are any future drinks (shouldn't happen normally, but just in case)
    const futureDrinks = sortedDrinks.filter(d => new Date(d.timestamp) > now);
    if (futureDrinks.length > 0) {
      return futureDrinks;
    }
    // If there are recent drinks still being absorbed, include them in the session
    if (recentDrinks.length > 0) {
      return recentDrinks;
    }
    // We're sober and no future/recent drinks - return empty (no active session)
    return [];
  }

  // We have active BAC, find where this session started
  // Work backwards through time to find when BAC was last 0
  let sessionStartTime: Date | null = null;

  // Check each drink as a potential session start
  for (let i = sortedDrinks.length - 1; i >= 0; i--) {
    const drink = sortedDrinks[i];
    const drinkTime = new Date(drink.timestamp);

    // Get drinks before this one
    const drinksBefore = sortedDrinks.slice(0, i);

    if (drinksBefore.length === 0) {
      // This is the first drink, session starts here
      sessionStartTime = drinkTime;
      break;
    }

    // Check BAC just before this drink was consumed
    const timeJustBefore = new Date(drinkTime.getTime() - 60000); // 1 minute before
    const bacBefore = getBACAtTime(drinksBefore, profile, timeJustBefore);

    if (bacBefore === 0) {
      // BAC was 0 before this drink, so this drink starts a new session
      sessionStartTime = drinkTime;
      break;
    }
  }

  if (!sessionStartTime) {
    // Fallback: return all drinks
    return sortedDrinks;
  }

  // Return all drinks from session start onwards
  return sortedDrinks.filter(d => new Date(d.timestamp) >= sessionStartTime);
}

/**
 * Calculate Standard Units (SU) from grams of alcohol
 * Formula: su = alcoholGrams / GRAMS_PER_STANDARD_UNIT
 */
export function calculateStandardUnits(alcoholGrams: number): number {
  return alcoholGrams / STANDARD_UNIT_CONSTANTS.GRAMS_PER_STANDARD_UNIT;
}

/**
 * Calculate Standard Units for a single drink
 * Formula: volumeMl × (abvPercent / 100) × 0.789 / gramsPerSU
 */
export function calculateDrinkStandardUnits(volumeMl: number, abvPercent: number): number {
  const alcoholGrams = calculateAlcoholGrams(volumeMl, abvPercent);
  return calculateStandardUnits(alcoholGrams);
}

/**
 * Calculate total Standard Units for an array of drinks
 */
export function calculateTotalStandardUnits(drinks: DrinkEntry[]): number {
  return drinks.reduce((total, drink) => {
    return total + calculateDrinkStandardUnits(drink.volumeMl, drink.abvPercent);
  }, 0);
}

/**
 * Calculate total alcohol grams for an array of drinks
 */
export function calculateTotalAlcoholGrams(drinks: DrinkEntry[]): number {
  return drinks.reduce((total, drink) => {
    return total + calculateAlcoholGrams(drink.volumeMl, drink.abvPercent);
  }, 0);
}

/**
 * Format Standard Units for display (German locale)
 */
export function formatStandardUnits(su: number): string {
  return su.toFixed(1).replace('.', ',');
}
