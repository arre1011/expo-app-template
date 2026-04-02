export interface Analytics {
  track(event: string, props?: Record<string, unknown>): void;
  screen(name: string, props?: Record<string, unknown>): void;
}

export const AnalyticsEvents = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PAYWALL_VIEWED: 'paywall_viewed',
  PAYWALL_VARIANT_VIEWED: 'paywall_variant_viewed',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_CANCELLED: 'purchase_cancelled',
  DEEP_LINK_MATCHED: 'deep_link_matched',
  DEEP_LINK_OFFER_APPLIED: 'deep_link_offer_applied',
  NOTIFICATION_RECEIVED: 'notification_received',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
