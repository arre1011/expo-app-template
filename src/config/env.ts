import { Platform } from 'react-native';
import { featureFlags } from '@/config/featureFlags';

const readEnv = (value: string | undefined): string => value?.trim() ?? '';

export const env = {
  sentryDsn: readEnv(process.env.EXPO_PUBLIC_SENTRY_DSN),
  posthogKey: readEnv(process.env.EXPO_PUBLIC_POSTHOG_KEY),
  posthogHost: readEnv(process.env.EXPO_PUBLIC_POSTHOG_HOST),
  revenueCatIosApiKey: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY),
  revenueCatAndroidApiKey: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY),
} as const;

type KeyStatus = { present: boolean; source: 'production' | 'test' | 'missing' };

function detectKeySource(key: string, prodPrefixes?: string[]): KeyStatus {
  if (!key) return { present: false, source: 'missing' };
  if (prodPrefixes?.some(p => key.startsWith(p))) return { present: true, source: 'production' };
  if (key.startsWith('test_')) return { present: true, source: 'test' };
  return { present: true, source: 'production' };
}

/**
 * Validate environment variables and log their status.
 * Call once at app startup to surface missing or misconfigured keys early.
 */
export function validateEnv(): void {
  const mode = __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION';
  const revenueCatKey = Platform.OS === 'ios' ? env.revenueCatIosApiKey : env.revenueCatAndroidApiKey;
  const revenueCatPlatform = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const revenueCatPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';

  const keys: { name: string; status: KeyStatus }[] = [
    { name: 'Sentry DSN', status: detectKeySource(env.sentryDsn) },
    { name: 'PostHog Key', status: detectKeySource(env.posthogKey) },
    { name: 'PostHog Host', status: detectKeySource(env.posthogHost) },
    ...(featureFlags.revenueCat
      ? [{ name: `RevenueCat (${revenueCatPlatform})`, status: detectKeySource(revenueCatKey, [revenueCatPrefix]) }]
      : []),
  ];

  const missing = keys.filter(k => !k.status.present);
  const configured = keys.filter(k => k.status.present);

  console.log(`\n========================================`);
  console.log(`  ENV CHECK  [${mode}]`);
  console.log(`========================================`);

  if (configured.length > 0) {
    configured.forEach(k => {
      const badge = k.status.source === 'production' ? 'PROD' : 'TEST';
      console.log(`  [${badge}]  ${k.name}`);
    });
  }

  if (missing.length > 0) {
    console.warn(`  ----------------------------------------`);
    missing.forEach(k => {
      console.warn(`  [MISSING]  ${k.name}`);
    });
    console.warn(`  ----------------------------------------`);
    console.warn(`  Setup:  docs/template/new-app-setup.md`);
    console.warn(`  Keys:   docs/template/integrations.md`);
    console.warn(`  Local:  cp .env.local.example .env.local`);
    console.warn(`  Prod:   eas secret:create --name <KEY> --value <VALUE>`);
  }

  console.log(`========================================\n`);

  // In production builds, warn loudly about critical missing keys
  if (!__DEV__ && featureFlags.revenueCat && missing.some(k => k.name.includes('RevenueCat'))) {
    console.error('CRITICAL: RevenueCat key missing in production build — subscriptions will not work!');
  }
  if (!__DEV__ && missing.some(k => k.name.includes('Sentry'))) {
    console.error('CRITICAL: Sentry DSN missing in production build — error tracking disabled!');
  }
}
