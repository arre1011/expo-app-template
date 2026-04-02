/**
 * Analytics Service - PostHog wrapper for anonymous product analytics.
 *
 * All tracking is anonymous (no identify() calls) so no GDPR consent is required.
 * The client is disabled until a real PostHog key is provided.
 */
import PostHog from 'posthog-react-native';
import { appConfig } from '@/config/appConfig';
import { env } from '@/config/env';
import type { Analytics } from './analytics';

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

export const analytics: Analytics = {
  track: (event, props) => {
    posthog.capture(event, props);
  },
  screen: (name, props) => {
    posthog.capture('$screen', { screen_name: name, ...props });
  },
};
