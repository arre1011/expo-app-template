/**
 * Feature Flags Configuration
 *
 * Keep this small and product-oriented.
 * Add new flags when the template grows real branches of behavior.
 */

import type { OfferType } from '@/features/core/subscription/model/types';

export const featureFlags = {
  // ─── Infrastructure Toggles ────────────────────────────────────────
  // Set to true when your app uses RevenueCat for subscriptions.
  // When false, RevenueCat is never initialized and all subscription
  // features (paywall, trial reminder, subscription wall) are disabled.
  revenueCat: false,

  // ─── Optional Features (remove if not needed in your app) ──────────
  calendarTab: true,
  statisticsTab: false,

  // ─── Showcase (only visible in dev, delete _showcase/ folder for production apps) ──
  showcaseTab: __DEV__,

  // ─── Core Feature Flags ────────────────────────────────────────────
  onboardingPaywall: true,
  paywallBenefits: false,
  paywallTrustSignals: true,
  subscriptionRequired: !__DEV__,
  trialReminder: true,
  subscriptionSection: true,
  deepLinkOffers: true,
  // Keep direct app-link offer routing enabled.
  // Deferred matching stays off until a replacement provider such as AppsFlyer is integrated.
  deferredDeepLinkMatching: false,
} as const;

// ─── Dev Override: Force a specific paywall variant for testing ────────────
// Set to an OfferType to bypass provider resolution and simulate a deep link offer.
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

// Flags that require RevenueCat to function
const requiresRevenueCat: ReadonlySet<FeatureFlag> = new Set([
  'onboardingPaywall',
  'subscriptionRequired',
  'trialReminder',
  'subscriptionSection',
  'paywallBenefits',
  'paywallTrustSignals',
]);

// Helper function to check if a feature is enabled.
// Subscription-related flags automatically return false when revenueCat is off.
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  if (!featureFlags.revenueCat && requiresRevenueCat.has(flag)) return false;
  return featureFlags[flag];
};
