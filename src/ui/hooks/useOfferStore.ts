/**
 * Offer Store — Tracks deep link offer state for paywall variant routing.
 *
 * This store lives in memory only (no persistence). DeepLinkNow handles
 * deferred matching on reinstall, so we don't need to persist the offer.
 */

import { create } from 'zustand';

export type OfferType = 'standard' | 'influencer_trial' | 'gift';

export interface OfferState {
  offerType: OfferType;
  influencerName: string | null;
  campaignId: string | null;
  trialDays: number;
  /** True once DeepLinkNow has resolved (or timed out). Prevents premature routing. */
  isDeepLinkResolved: boolean;

  setOffer: (offer: Partial<Omit<OfferState, 'setOffer' | 'resetOffer'>>) => void;
  resetOffer: () => void;
}

const DEFAULT_STATE = {
  offerType: 'standard' as OfferType,
  influencerName: null,
  campaignId: null,
  trialDays: 7,
  isDeepLinkResolved: false,
};

export const useOfferStore = create<OfferState>((set) => ({
  ...DEFAULT_STATE,
  setOffer: (offer) => set((state) => ({ ...state, ...offer })),
  resetOffer: () => set(DEFAULT_STATE),
}));

// Selector hooks
export const useOfferType = () => useOfferStore((s) => s.offerType);
export const useIsDeepLinkResolved = () => useOfferStore((s) => s.isDeepLinkResolved);
