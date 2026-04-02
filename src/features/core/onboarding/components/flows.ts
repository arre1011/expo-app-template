import type { OnboardingStep } from './types';

/** Standard organic flow */
export const STANDARD_FLOW: OnboardingStep[] = [
  'intro_emotional',
  'science_based',
  'personalization',
  'motivation_select',
  'pre_paywall_hook',
  'paywall',
];

/** Influencer flow — personalized welcome + core setup + paywall */
export const INFLUENCER_FLOW: OnboardingStep[] = [
  'intro_influencer',
  'science_based',
  'personalization',
  'motivation_select',
  'pre_paywall_hook',
  'paywall',
];

/** Gift flow — standard flow with gift paywall */
export const GIFT_FLOW: OnboardingStep[] = [
  'intro_emotional',
  'science_based',
  'personalization',
  'motivation_select',
  'pre_paywall_hook',
  'paywall',
];
