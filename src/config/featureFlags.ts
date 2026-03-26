/**
 * Feature Flags Configuration
 *
 * Toggle features on/off for different release stages.
 * Set to `true` to enable, `false` to disable.
 *
 * For MVP release, most features are disabled.
 * Enable them gradually as they are tested and ready.
 */

import type { OfferType } from '../ui/hooks/useOfferStore';

export const featureFlags = {
  // Navigation Tabs
  calendarTab: true,         // Calendar tab in bottom navigation
  statisticsTab: false,      // Statistics tab in bottom navigation
  examplesTab: __DEV__,      // Examples/Storybook tab (dev only)

  // Home Screen Features
  pastSessionsList: false,   // Show past sessions on home screen (moved to calendar)
  quickAddBar: true,        // Quick Add bar for recent drinks
  bacChartVictory: false,    // Second BAC chart (Victory)
  compactLimitCard: true,    // Compact limit card: "Peak / Boundary 0.00 / 0.50%"
  estimateDisclaimer: false, // "Estimate only - not for driving decisions" under alcohol level

  // Drink Picker Features
  drinkFavorites: false,     // Favorites in drink picker
  volumePresets: false,      // Volume preset buttons in add/edit drink modal

  // Paywall Features
  onboardingPaywall: true,       // Show paywall screen at end of onboarding (MVP: skip to app)
  paywallSavingsCard: true,      // "Save $48-72/month" / "Fun Fact" card on paywall (mentions subscription)
  paywallProfileBanner: true,    // "Your Profile is Ready!" banner on paywall
  paywallBenefits: false,              // Benefits section (3 feature items) on paywall
  paywallTrustSignals: true,        // Trust signals section (cancel anytime, reminder) on paywall
  paywallSkipButton: false,        // "Skip for now" button on paywall (MVP: allow free usage)

  // Subscription enforcement
  subscriptionRequired: !__DEV__,  // Auto: false in development, true in production builds
  trialReminder: true,             // Push notification reminder 2 days before trial expires

  // Subscription UI (MVP: hidden until Pro features are ready)
  subscriptionSection: true,     // Subscription section in settings

  // Deep Link Offers
  deepLinkOffers: true,           // Enable deep link offer detection (DeepLinkNow)

  // Awards/Achievements (Beta)
  awardsSection: false,           // Awards section in calendar tab + milestone celebrations
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

// Dev override configuration for influencer variant
export const devOfferConfig = {
  influencerName: 'TestInfluencer',  // Shown as "@TestInfluencer" on paywall
  trialDays: 14,                     // Number of trial days
};

// Type for feature flag keys
export type FeatureFlag = keyof typeof featureFlags;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return featureFlags[flag];
};
