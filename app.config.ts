import type { ExpoConfig } from 'expo/config';
import { appConfig } from './src/config/appConfig';

const config: ExpoConfig = {
  name: appConfig.appName,
  slug: appConfig.slug,
  version: appConfig.version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: appConfig.scheme,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: appConfig.ios.bundleIdentifier,
    buildNumber: appConfig.ios.buildNumber,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: appConfig.android.package,
    minSdkVersion: 26,
    versionCode: appConfig.android.versionCode,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    './plugins/remove-ipad-orientations',
    'expo-router',
    'expo-sqlite',
    [
      'expo-notifications',
      {
        icon: './assets/adaptive-icon.png',
        color: '#ffffff',
      },
    ],
    'expo-localization',
    [
      '@sentry/react-native',
      {
        organization: appConfig.integrations.sentry.organization,
        project: appConfig.integrations.sentry.project,
        url: appConfig.integrations.sentry.url,
      },
    ],
  ],
  extra: {
    router: {},
  },
};

export default config;
