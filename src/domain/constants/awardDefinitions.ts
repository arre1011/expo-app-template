/**
 * Award Definitions
 *
 * Configuration for streak awards in the app.
 * Only motivating streak awards are active.
 */

import { AwardId, AwardTier, AwardCategory } from '../models/types';
import { colors } from '../../ui/theme';

// Milestone thresholds for each award type
export const AWARD_MILESTONES: Record<AwardId, number[]> = {
  limit_keeper: [7, 14, 30, 60, 90, 180, 365],
  mindful_drinker: [3, 5, 10, 25, 50, 100, 200],
};

// Ordered tier progression (used for index-based assignment)
// Standard progression: Bronze → Silver → Gold → Platinum → Diamond → Sapphire → Ruby
const TIER_PROGRESSION: AwardTier[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'sapphire',
  'ruby',
];

// Map milestone value to tier based on position in milestone array
export function getTierForMilestone(awardId: AwardId, milestoneValue: number): AwardTier {
  const milestones = AWARD_MILESTONES[awardId];
  const index = milestones.indexOf(milestoneValue);

  if (index === -1) return 'bronze'; // Default fallback

  // Each milestone gets its own unique tier
  const tierIndex = Math.min(index, TIER_PROGRESSION.length - 1);
  return TIER_PROGRESSION[tierIndex];
}

// Get current tier based on current streak value
export function getCurrentTier(awardId: AwardId, currentValue: number): AwardTier | null {
  const milestones = AWARD_MILESTONES[awardId];

  // Find highest milestone reached
  let highestMilestone: number | null = null;
  for (const milestone of milestones) {
    if (currentValue >= milestone) {
      highestMilestone = milestone;
    }
  }

  if (highestMilestone === null) return null;
  return getTierForMilestone(awardId, highestMilestone);
}

// Award metadata
export interface AwardDefinition {
  id: AwardId;
  name: string;
  description: string;
  category: AwardCategory;
  icon: string; // Ionicons name
  milestones: number[];
}

export const AWARD_DEFINITIONS: Record<AwardId, AwardDefinition> = {
  limit_keeper: {
    id: 'limit_keeper',
    name: 'Limit Keeper',
    description: 'Consecutive days under your alcohol level limit',
    category: 'streak',
    icon: 'shield-checkmark-outline',
    milestones: AWARD_MILESTONES.limit_keeper,
  },
  mindful_drinker: {
    id: 'mindful_drinker',
    name: 'Mindful Drinker',
    description: 'Consecutive sessions under your alcohol level limit',
    category: 'streak',
    icon: 'heart-outline',
    milestones: AWARD_MILESTONES.mindful_drinker,
  },
};

// Get next milestone for a given value
export function getNextMilestone(awardId: AwardId, currentValue: number): number {
  const milestones = AWARD_MILESTONES[awardId];

  for (const milestone of milestones) {
    if (currentValue < milestone) {
      return milestone;
    }
  }

  // Already passed all milestones - return last one
  return milestones[milestones.length - 1];
}

// Calculate progress percentage to next milestone
export function calculateProgressPercent(awardId: AwardId, currentValue: number): number {
  const milestones = AWARD_MILESTONES[awardId];

  // Find current milestone range
  let prevMilestone = 0;
  let nextMilestone = milestones[0];

  for (let i = 0; i < milestones.length; i++) {
    if (currentValue >= milestones[i]) {
      prevMilestone = milestones[i];
      nextMilestone = milestones[i + 1] ?? milestones[i];
    } else {
      nextMilestone = milestones[i];
      break;
    }
  }

  // If already at max milestone
  if (currentValue >= milestones[milestones.length - 1]) {
    return 100;
  }

  // Calculate percentage within current range
  const range = nextMilestone - prevMilestone;
  const progress = currentValue - prevMilestone;

  return Math.min(100, Math.round((progress / range) * 100));
}

// Tier colors for UI (7 unique tiers)
export const TIER_COLORS: Record<AwardTier, string> = {
  bronze: colors.awardBronze,
  silver: colors.awardSilver,
  gold: colors.awardGold,
  platinum: colors.awardPlatinum,
  diamond: colors.awardDiamond,
  sapphire: colors.awardSapphire,
  ruby: colors.awardRuby,
};

export const TIER_BG_COLORS: Record<AwardTier, string> = {
  bronze: colors.awardBronzeBg,
  silver: colors.awardSilverBg,
  gold: colors.awardGoldBg,
  platinum: colors.awardPlatinumBg,
  diamond: colors.awardDiamondBg,
  sapphire: colors.awardSapphireBg,
  ruby: colors.awardRubyBg,
};

// Tier labels for display (unique names for each level)
export const TIER_LABELS: Record<AwardTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
  sapphire: 'Sapphire',
  ruby: 'Ruby',
};

// Tier icons for display (Ionicons names)
export const TIER_ICONS: Record<AwardTier, string> = {
  bronze: 'shield-outline',
  silver: 'shield-half-outline',
  gold: 'trophy-outline',
  platinum: 'star-outline',
  diamond: 'diamond-outline',
  sapphire: 'sparkles-outline',
  ruby: 'flame-outline',
};

// Label for users who haven't reached any milestone yet
export const BEGINNER_LABEL = 'Beginner';

// Get display label for current tier (or "Beginner" if no tier)
export function getTierLabel(tier: AwardTier | null): string {
  if (tier === null) return BEGINNER_LABEL;
  return TIER_LABELS[tier];
}

// Get tier for a specific milestone by index (each milestone gets unique tier)
export function getTierForMilestoneIndex(_awardId: AwardId, index: number): AwardTier {
  // Each milestone gets its own tier (capped at available tiers)
  // _awardId kept for future flexibility (different progressions per award)
  const tierIndex = Math.min(index, TIER_PROGRESSION.length - 1);
  return TIER_PROGRESSION[tierIndex];
}

// Active awards
export const PHASE2_AWARDS: AwardId[] = [
  'limit_keeper',
  'mindful_drinker',
];

// Backwards compatibility
export const PHASE1_AWARDS = PHASE2_AWARDS;

// Check if award is implemented in current phase
export function isAwardActive(awardId: AwardId): boolean {
  return PHASE2_AWARDS.includes(awardId);
}
