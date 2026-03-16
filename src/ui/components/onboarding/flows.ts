import type { OnboardingStep } from './types';

/** Standard organic flow — all 11 screens */
export const STANDARD_FLOW: OnboardingStep[] = [
  'intro_emotional',
  'intro_not',
  'intro_benefits',
  'how_monitoring',
  'profile_limit',
  'profile_sex',
  'profile_weight',
  'profile_volume',
  'motivation_select',
  'motivation_partner',
  'paywall',
];

/** Influencer flow — personalized welcome + profile + emotional peak + paywall */
export const INFLUENCER_FLOW: OnboardingStep[] = [
  'intro_influencer',
  'profile_sex',
  'profile_weight',
  'profile_volume',
  'motivation_partner',
  'paywall',
];

/** Gift flow — emotional intro + profile + emotional peak + paywall */
export const GIFT_FLOW: OnboardingStep[] = [
  'intro_emotional',
  'profile_sex',
  'profile_weight',
  'profile_volume',
  'motivation_partner',
  'paywall',
];
