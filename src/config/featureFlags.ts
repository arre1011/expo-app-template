/**
 * Feature Flags Configuration
 *
 * Keep this small and product-oriented.
 * Add new flags when the template grows real branches of behavior.
 */

import type { OfferType } from '../ui/hooks/useOfferStore';

export const featureFlags = {
  calendarTab: true,
  statisticsTab: false,
  examplesTab: __DEV__,
  onboardingPaywall: true,
  paywallBenefits: false,
  paywallTrustSignals: true,
  subscriptionRequired: !__DEV__,
  trialReminder: true,
  subscriptionSection: true,
  deepLinkOffers: true,
} as const;

// ─── Dev Override: Force a specific paywall variant for testing ────────────
// Set to an OfferType to bypass DeepLinkNow and simulate a deep link offer.
// Set to null for normal behavior (production default).
//
// Usage:
//   devOfferOverride: null,               ← Normal (production)
//   devOfferOverride: 'standard',         ← Standard paywall (organic user)
//   devOfferOverride: 'influencer_trial', ← Influencer paywall (14-day trial + countdown)
//   devOfferOverride: 'gift',             ← Gift paywall (price struck through, FREE)
//
// ⚠️  ALWAYS set to null before building for production/TestFlight!
export const devOfferOverride: OfferType | null = null;

export const devOfferConfig = {
  influencerName: 'TestInfluencer',
  trialDays: 14,
};

// Type for feature flag keys
export type FeatureFlag = keyof typeof featureFlags;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return featureFlags[flag];
};
