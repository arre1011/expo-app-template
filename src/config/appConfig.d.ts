export declare const appConfig: {
  readonly appName: string;
  readonly slug: string;
  readonly scheme: string;
  readonly version: string;
  readonly ios: {
    readonly bundleIdentifier: string;
    readonly buildNumber: string;
  };
  readonly android: {
    readonly package: string;
    readonly versionCode: number;
  };
  readonly supportEmail: string;
  readonly legal: {
    readonly termsUrl: string;
    readonly privacyUrl: string;
  };
  readonly integrations: {
    readonly posthog: {
      readonly host: string;
    };
    readonly sentry: {
      readonly organization: string;
      readonly project: string;
      readonly url: string;
    };
    readonly revenueCat: {
      readonly entitlementId: string;
      readonly productIds: {
        readonly monthly: string;
        readonly yearly: string;
      };
    };
  };
};
