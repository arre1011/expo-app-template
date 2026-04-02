/**
 * Offer Store — Tracks deep link offer state for paywall variant routing.
 *
 * This store lives in memory only (no persistence). Deferred matching can be
 * re-resolved by the active deep link provider, so we don't persist the offer.
 */

import { create } from 'zustand';
import type { OfferType } from '../model/types';

export type { OfferType } from '../model/types';

export interface OfferState {
  offerType: OfferType;
  influencerName: string | null;
  campaignId: string | null;
  trialDays: number;
  /** True once deferred deep link resolution has completed (or timed out). */
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
