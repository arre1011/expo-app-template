/**
 * Deep Link Service — Wraps DeepLinkNow SDK for offer detection.
 *
 * Handles both deferred deep links (new installs via fingerprint matching)
 * and direct deep links (app already installed, opened via URL).
 *
 * The native module may not be available (e.g., Expo Go, old dev client).
 * All SDK calls are wrapped in try/catch to fail gracefully.
 */

import type { OfferType } from '../ui/hooks/useOfferStore';

// Minimum confidence score for accepting a deferred deep link match (MEDIUM threshold)
const CONFIDENCE_THRESHOLD = 50;

const DLN_API_KEY = process.env.EXPO_PUBLIC_DEEPLINKNOW_API_KEY ?? '';

// Lazy-load the native module to prevent crash on import if not available
let DeepLinkNow: any = null;
try {
  DeepLinkNow = require('@deeplinknow/react-native').default;
} catch {
  console.warn('DeepLinkNow: Native module not available (expected in Expo Go)');
}

export interface ResolvedOffer {
  offerType: OfferType;
  influencerName: string | null;
  campaignId: string | null;
  trialDays: number;
}

/**
 * Initialize DeepLinkNow SDK. Call once at app startup.
 */
export async function initializeDeepLinkNow(): Promise<void> {
  if (!DeepLinkNow) {
    console.warn('DeepLinkNow: SDK not available, skipping initialization');
    return;
  }

  if (!DLN_API_KEY) {
    console.warn('DeepLinkNow: No API key configured, skipping initialization');
    return;
  }

  try {
    await DeepLinkNow.initialize(DLN_API_KEY, {
      enableLogs: __DEV__,
    });
    console.log('✅ DeepLinkNow initialized');
  } catch (error) {
    console.error('DeepLinkNow initialization failed (non-blocking):', error);
  }
}

/**
 * Attempt to resolve a deferred deep link offer.
 * Uses fingerprint matching (both platforms) and Play Install Referrer (Android).
 * Returns null if no matching offer found or confidence is too low.
 */
export async function findDeferredOffer(): Promise<ResolvedOffer | null> {
  if (!DeepLinkNow) return null;

  // Try fingerprint match (works on both iOS and Android)
  try {
    const response = await DeepLinkNow.findDeferredUser();
    if (response?.matches && response.matches.length > 0) {
      const best = response.matches[0];
      if (best.confidence_score >= CONFIDENCE_THRESHOLD && best.deeplink) {
        return parseOfferFromMetadata(
          best.deeplink.metadata,
          best.deeplink.campaign_id ?? null
        );
      }
    }
  } catch (err) {
    console.warn('DeepLinkNow fingerprint match failed:', err);
  }

  // Android-only: Play Install Referrer fallback
  try {
    const referrer = await DeepLinkNow.checkDeferredDeepLink();
    if (referrer) {
      return parseOfferFromMetadata(
        referrer.metadata,
        referrer.campaignId ?? null
      );
    }
  } catch {
    // Not Android or referrer unavailable — expected on iOS
  }

  return null;
}

/**
 * Parse offer parameters from a direct deep link URL.
 * Used when app is already installed and opened via URL scheme.
 *
 * Expected URL format: drink-tracking://paywall?offer=influencer_trial&influencer_name=john
 */
export function parseOfferFromUrl(url: string): ResolvedOffer | null {
  try {
    const urlObj = new URL(url);
    const offer = urlObj.searchParams.get('offer');

    if (!offer) return null;

    const metadata: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      metadata[key] = value;
    });

    return parseOfferFromMetadata(metadata, metadata.campaign_id ?? null);
  } catch {
    return null;
  }
}

/** Extract typed offer data from deep link metadata */
function parseOfferFromMetadata(
  metadata: Record<string, any>,
  campaignId: string | null
): ResolvedOffer {
  const offerParam = metadata?.offer ?? 'standard';

  if (offerParam === 'influencer_trial') {
    return {
      offerType: 'influencer_trial',
      influencerName: metadata?.influencer_name ?? null,
      campaignId,
      trialDays: Number(metadata?.trial_days ?? 14),
    };
  }

  if (offerParam === 'free' || offerParam === 'gift') {
    return {
      offerType: 'gift',
      influencerName: metadata?.influencer_name ?? null,
      campaignId,
      trialDays: 0,
    };
  }

  // Unknown offer type — treat as standard
  return {
    offerType: 'standard',
    influencerName: null,
    campaignId,
    trialDays: 7,
  };
}
