export const appConfig = {
  appName: 'Template App',
  slug: 'template-app',
  scheme: 'template-app',
  version: '1.0.0',
  ios: {
    bundleIdentifier: 'com.example.templateapp',
    buildNumber: '1',
  },
  android: {
    package: 'com.example.templateapp',
    versionCode: 1,
  },
  supportEmail: 'support@example.com',
  legal: {
    termsUrl: 'https://example.com/terms',
    privacyUrl: 'https://example.com/privacy',
  },
  integrations: {
    posthog: {
      host: 'https://eu.i.posthog.com',
    },
    sentry: {
      organization: 'your-sentry-org',
      project: 'your-sentry-project',
      url: 'https://sentry.io/',
    },
    revenueCat: {
      entitlementId: 'pro',
      productIds: {
        monthly: 'monthly',
        yearly: 'yearly',
        lifetime: 'lifetime_pro',
      },
    },
  },
} as const;
