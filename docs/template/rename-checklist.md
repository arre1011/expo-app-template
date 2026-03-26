# Rename Checklist

Diese Liste ist für den Moment gedacht, in dem du aus dem Template eine echte App machst.

## Muss ersetzt werden

- `src/config/appConfig.ts`
  - `appName`
  - `slug`
  - `scheme`
  - `ios.bundleIdentifier`
  - `android.package`
  - `supportEmail`
  - `legal.*`
  - Sentry-Projektfelder
  - RevenueCat-Produkt-IDs falls nötig

- `.env.local`
  - RevenueCat Keys
  - PostHog Key
  - Sentry DSN
  - DeepLinkNow Key

- Assets
  - `assets/icon.png`
  - `assets/adaptive-icon.png`
  - `assets/splash-icon.png`
  - `assets/favicon.png`

- Product-/Service-Projekte
  - RevenueCat
  - PostHog
  - Sentry
  - optional DeepLinkNow

## Muss geprüft werden

- `package.json`
  - Paketname

- `.maestro/config.yaml`
  - `appId`

- Onboarding / Paywall / Reminder Copy

- Privacy / Terms

- Feature Flags in `src/config/featureFlags.ts`

## Sollte vor erstem Release laufen

```bash
npm run template:audit
```

## Typische Fehler

- Bundle ID in Expo geändert, aber RevenueCat / Sentry / Stores nicht
- PostHog-Key einer anderen App wiederverwendet
- `slug` und `scheme` vergessen
- Support-Mail und Legal-URLs noch auf Placeholder
- alte Placeholder-Copy vor Release nicht ersetzt
