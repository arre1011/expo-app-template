# Template Guide

Diese Doku ist der Überblick über das Template.

## Was das Template heute enthält

- Expo Router mit Tabs und Modal-Routen
- generisches Onboarding
- RevenueCat-basierte Paywall
- Trial-Reminder-Notifications
- Kalender mit Daily Notes / Mood Tracking
- Settings-Screen mit Subscription- und Dev-Bereichen
- Theme-Tokens und wiederverwendbare UI-Bausteine
- Example-Screens für Pattern-Reuse

## Was bewusst nicht mehr enthalten ist

- Drink-/BAC-/Session-Logik
- alte Statistics-Architektur
- app-spezifische Store-Credentials
- app-spezifische Analytics-/Sentry-Keys
- domain-spezifische Doku aus der Vorgänger-App

## Zentrale Dateien

| Datei | Zweck |
|------|-------|
| `src/config/appConfig.ts` | App-Identität und per-App-Konfiguration |
| `app.config.ts` | Expo-Konfiguration aus `appConfig` |
| `src/config/featureFlags.ts` | Produkt- und Template-Flags |
| `.env.local.example` | benötigte Env-Variablen |
| `src/config/env.ts` | Runtime-Zugriff auf Env-Variablen |
| `src/services/revenueCatService.ts` | RevenueCat-Integration |
| `src/services/analyticsService.ts` | PostHog-Integration |
| `app/_layout.tsx` | globale Provider, Sentry, Notifications |

## Empfohlener Ablauf für neue Apps

1. App-Identität in `src/config/appConfig.ts` setzen
2. `.env.local` aus `.env.local.example` anlegen
3. externe Projekte anlegen: RevenueCat, PostHog, Sentry, optional DeepLinkNow
4. Onboarding-, Home-, Reminder- und Privacy-Copy ersetzen
5. `npm run template:audit` laufen lassen
6. `eas init` bzw. neues EAS-Projekt aufsetzen

## Weiterführende Doku

- [New App Setup](./new-app-setup.md)
- [Integrations](./integrations.md)
- [Rename Checklist](./rename-checklist.md)
- [Template Strategy](./strategy.md)
