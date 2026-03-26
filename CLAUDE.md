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

- `app/` routes and layouts
- `src/config/` app identity, env access, feature flags
- `src/data/` SQLite and repositories
- `src/domain/` types, validation, constants
- `src/services/` integrations and orchestration
- `src/ui/` components, hooks, sheets, theme

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
EXPO_PUBLIC_DEEPLINKNOW_API_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
EXPO_PUBLIC_SENTRY_DSN=
```

## Expectations

- Replace template placeholders before shipping
- Create new external projects per app
- Keep secrets out of the repo
- Run `npm run template:audit` before first release
