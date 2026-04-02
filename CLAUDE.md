# Expo App Template

Production-ready Expo template for subscription-oriented mobile apps.

## Core Stack

- React Native + Expo
- Expo Router
- Zustand
- SQLite
- RevenueCat
- PostHog
- Sentry
- expo-notifications
- @gorhom/bottom-sheet

## Project Structure

- `app/` routes and layouts (thin re-exports from features)
- `src/config/` app identity, env access, feature flags
- `src/infrastructure/` analytics, error tracking, subscriptions, notifications (facade pattern)
- `src/features/` all feature logic, see `src/features/README.md` for details
  - `core/` template features every app needs (onboarding, subscription, settings, home, privacy)
  - `optional/` template features to keep or delete (calendar, statistics)
  - `_showcase/` reference implementations, DEV only, always delete for production apps
  - `app-specific/` app-specific features go here
- `src/ui/` shared components, theme, hooks
- `src/bootstrap/` app initialization (RootApp)

## Feature Placement Rules

- New app features always go in `src/features/app-specific/`
- Never put app-specific code in `core/` or `optional/`
- Each feature gets its own folder with components, hooks, stores, types
- Features expose a public API via `index.ts` -- no reaching into other features' internals
- Shared UI primitives go in `src/ui/components/`, not in a feature folder
- Route files in `app/` should be thin re-exports: `export { default } from '@/features/...'`

## Important Files

- `src/config/appConfig.ts`
- `app.config.ts`
- `src/config/featureFlags.ts`
- `src/config/env.ts`

## Environment Variables

Required in `.env.local`:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
EXPO_PUBLIC_SENTRY_DSN=
```

## Expectations

- Replace template placeholders before shipping
- Create new external projects per app
- Keep secrets out of the repo
- Run `npm run template:audit` before first release
