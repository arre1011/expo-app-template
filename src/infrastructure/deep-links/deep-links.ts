import type { OfferType } from '@/features/core/subscription/model/types';

export interface ResolvedOffer {
  offerType: OfferType;
  influencerName: string | null;
  campaignId: string | null;
  trialDays: number;
}

export interface DeferredDeepLinkProvider {
  initialize(): Promise<void>;
  findDeferredOffer(): Promise<ResolvedOffer | null>;
}

/**
 * Parse offer parameters from a direct deep link URL.
 * Used when the app is already installed and opened via the app scheme.
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

/**
 * Shared metadata parser for direct links and future deferred-link providers.
 * When AppsFlyer is added, its adapter should reuse this function.
 */
export function parseOfferFromMetadata(
  metadata: Record<string, unknown>,
  campaignId: string | null
): ResolvedOffer {
  const offerParam = metadata?.offer ?? 'standard';

  if (offerParam === 'influencer_trial') {
    return {
      offerType: 'influencer_trial',
      influencerName: readString(metadata?.influencer_name),
      campaignId,
      trialDays: readNumber(metadata?.trial_days, 14),
    };
  }

  if (offerParam === 'free' || offerParam === 'gift') {
    return {
      offerType: 'gift',
      influencerName: readString(metadata?.influencer_name),
      campaignId,
      trialDays: 0,
    };
  }

  return {
    offerType: 'standard',
    influencerName: null,
    campaignId,
    trialDays: 7,
  };
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
