const readEnv = (value: string | undefined): string => value?.trim() ?? '';

export const env = {
  sentryDsn: readEnv(process.env.EXPO_PUBLIC_SENTRY_DSN),
  posthogKey: readEnv(process.env.EXPO_PUBLIC_POSTHOG_KEY),
  posthogHost: readEnv(process.env.EXPO_PUBLIC_POSTHOG_HOST),
  revenueCatIosApiKey: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY),
  revenueCatAndroidApiKey: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY),
  deepLinkNowApiKey: readEnv(process.env.EXPO_PUBLIC_DEEPLINKNOW_API_KEY),
} as const;
