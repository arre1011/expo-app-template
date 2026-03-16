import { DrinkPreset, DrinkType, VolumeUnit } from '../models/types';
import { formatVolumeCompact } from '../utils/volumeConversion';

// Standard Unit Constants
export const STANDARD_UNIT_CONSTANTS = {
  // Grams of pure alcohol per standard unit
  // German "Standardglas" = ~10-12g, we use 10g for simplicity
  GRAMS_PER_STANDARD_UNIT: 10,
  // Ethanol density (same as BAC_CONSTANTS, duplicated for clarity)
  ETHANOL_DENSITY: 0.789,
} as const;

// BAC Calculation Constants
export const BAC_CONSTANTS = {
  // Ethanol density in g/ml
  ETHANOL_DENSITY: 0.789,

  // Body water constant (r) by sex
  // These are typical average values
  R_MALE: 0.68,
  R_FEMALE: 0.55,
  R_DEFAULT: 0.60, // Used if no sex specified

  // Alcohol elimination rate in ‰ per hour
  // Typical range: 0.1 - 0.2 ‰/h
  ELIMINATION_RATE_SLOW: 0.10,
  ELIMINATION_RATE_STANDARD: 0.15,
  ELIMINATION_RATE_FAST: 0.20,

  // Absorption rate in grams of alcohol per minute
  // Based on average gastric emptying and intestinal absorption
  // Results in ~60 min absorption for 500ml beer (20g), ~40 min for 330ml beer (13g)
  ABSORPTION_GRAMS_PER_MINUTE: 0.33,

  // Legacy: Fixed absorption time (kept for reference, no longer used)
  // ABSORPTION_MINUTES: 40,

  // Time horizon for BAC curve in hours
  HORIZON_HOURS: 18,

  // Time step for BAC calculation in minutes
  TIME_STEP_MINUTES: 1,
} as const;

// Default User Profile Values
export const DEFAULT_USER_PROFILE = {
  weightKg: 75,
  eliminationRatePermillePerHour: BAC_CONSTANTS.ELIMINATION_RATE_STANDARD,
} as const;

// Default Daily Goal
export const DEFAULT_DAILY_GOAL = {
  maxBAC: 0.5, // 0.5‰ - Conservative limit (EU beginner driver limit)
  enabled: true,
} as const;

// US Standard Volumes (in ml) - used when volumeUnit is 'oz'
// These match typical US serving sizes
export const US_DRINK_VOLUMES: Record<DrinkType, number> = {
  beer_small: 355,  // 12 oz
  beer_large: 473,  // 16 oz
  wine: 148,        // 5 oz
  longdrink: 44,    // 1.5 oz spirit
  shot: 44,         // 1.5 oz
  custom: 355,      // default 12 oz
};

// Drink Presets (European/metric values)
export const DRINK_PRESETS: DrinkPreset[] = [
  {
    type: 'beer_small',
    name: 'Beer (Small)',
    description: '330ml · 5%',
    volumeMl: 330,
    abvPercent: 5.0,
    icon: 'beer-outline',
  },
  {
    type: 'beer_large',
    name: 'Beer (Large)',
    description: '500ml · 5%',
    volumeMl: 500,
    abvPercent: 5.0,
    icon: 'beer',
  },
  {
    type: 'wine',
    name: 'Wine',
    description: '150ml · 12.5%',
    volumeMl: 150,
    abvPercent: 12.5,
    icon: 'wine-outline',
  },
  {
    type: 'longdrink',
    name: 'Mixed Drink',
    description: '40ml spirit',
    volumeMl: 40,
    abvPercent: 40,
    icon: 'beer-outline',
  },
  {
    type: 'shot',
    name: 'Shot',
    description: '40ml · 40%',
    volumeMl: 40,
    abvPercent: 40,
    icon: 'cafe-outline',
  },
];

// Get preset by type
export function getDrinkPreset(type: DrinkType): DrinkPreset | undefined {
  return DRINK_PRESETS.find(p => p.type === type);
}

// Get the volume in ml for a preset based on user's volume unit preference
// Returns US standard sizes for oz users, EU sizes for ml users
export function getPresetVolumeMl(type: DrinkType, volumeUnit: VolumeUnit): number {
  if (volumeUnit === 'oz') {
    return US_DRINK_VOLUMES[type] ?? US_DRINK_VOLUMES.custom;
  }
  const preset = getDrinkPreset(type);
  return preset?.volumeMl ?? 330;
}

// Get preset description with dynamic volume unit
// Shows US standard sizes (12oz, 5oz) for oz users, EU sizes for ml users
export function getPresetDescription(preset: DrinkPreset, volumeUnit: VolumeUnit): string {
  const volumeMl = getPresetVolumeMl(preset.type, volumeUnit);

  // Special case for longdrink which describes spirit content
  if (preset.type === 'longdrink') {
    return `${formatVolumeCompact(volumeMl, volumeUnit)} spirit`;
  }
  return `${formatVolumeCompact(volumeMl, volumeUnit)} · ${preset.abvPercent}%`;
}

// Get r-value for sex
// 'other' uses the average (R_DEFAULT) between male and female values
export function getRValueForSex(sex: 'male' | 'female' | 'other' | null): number {
  switch (sex) {
    case 'male':
      return BAC_CONSTANTS.R_MALE;
    case 'female':
      return BAC_CONSTANTS.R_FEMALE;
    case 'other':
      return BAC_CONSTANTS.R_DEFAULT;
    default:
      return BAC_CONSTANTS.R_DEFAULT;
  }
}

// Elimination rate labels
export const ELIMINATION_RATE_LABELS = {
  [BAC_CONSTANTS.ELIMINATION_RATE_SLOW]: 'Slow',
  [BAC_CONSTANTS.ELIMINATION_RATE_STANDARD]: 'Standard',
  [BAC_CONSTANTS.ELIMINATION_RATE_FAST]: 'Fast',
} as const;

// App text constants
export const TEXT = {
  BAC_DISCLAIMER: 'Estimate only – not for driving decisions.',
  FULL_DISCLAIMER: `This app provides alcohol level estimates for informational and educational purposes only.

• Calculated values are ESTIMATES and may differ significantly from actual alcohol levels due to individual factors including metabolism, health conditions, medications, and food consumption.

• This app is NOT intended to determine your fitness to drive, operate machinery, or engage in any activity where impairment may pose a risk.

• NEVER use this app to decide whether it is safe to drive. The only safe option is to not drink and drive.

• This is not medical or legal advice and does not constitute a legal determination of intoxication.

• We expressly disclaim any liability for decisions made based on information provided by this app.

By using this app, you acknowledge and accept these limitations.`,
  GOAL_REACHED_TITLE: 'You reached your goal',
  GOAL_REACHED_MESSAGE: 'Your daily limit is reached. This is a good moment to take a breath. What would you like to do next?',
  GOAL_EXCEEDED_TITLE: 'Over the limit',
  GOAL_EXCEEDED_MESSAGE: 'You are over your goal. A break can help – you have nothing to prove.',
  SOBER_LABEL: 'Sober approx.',
  ESTIMATE_LABEL: 'Estimate',
  SUPPORT_MESSAGE: 'You decide – we support you.',
} as const;
