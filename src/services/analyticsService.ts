/**
 * Analytics Service - PostHog wrapper for anonymous product analytics.
 *
 * All tracking is anonymous (no identify() calls) so no GDPR consent is required.
 * The client is disabled until a real PostHog key is provided.
 */
import PostHog from 'posthog-react-native';
import { appConfig } from '../config/appConfig';
import { env } from '../config/env';

const posthogHost = env.posthogHost || appConfig.integrations.posthog.host;
const analyticsEnabled = env.posthogKey.length > 0;

// Shared PostHog instance - used by both PostHogProvider and imperative calls
export const posthog = new PostHog(
  env.posthogKey || 'phc_template_placeholder',
  {
    host: posthogHost,
    disabled: !analyticsEnabled,
  }
);

// Pre-defined event names for type safety
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
