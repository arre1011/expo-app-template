import * as Sentry from '@sentry/react-native';
import { env } from '@/config/env';

let initialized = false;

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

export function initializeErrorTracking(): void {
  if (initialized) return;

  Sentry.init({
    dsn: env.sentryDsn || undefined,
    integrations: [navigationIntegration],
    tracesSampleRate: 1.0,
    _experiments: {
      profilesSampleRate: 1.0,
    },
    enabled: !__DEV__ && env.sentryDsn.length > 0,
  });

  initialized = true;
}

export function wrapWithErrorTracking<T extends React.ComponentType<any>>(Component: T): T {
  return Sentry.wrap(Component) as T;
}

export { Sentry };
