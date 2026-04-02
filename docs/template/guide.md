# Template Guide

Diese Doku ist der Überblick über das Template.

## Feature-Kategorien

Alle Features liegen in `src/features/` -- Details in `src/features/README.md`.

### Core (`src/features/core/`)

Bleiben in jeder App. Werden über Template-Updates gepflegt.

- Onboarding, Subscription/Paywall, Settings, Home, Privacy
- Infrastructure: Analytics, Error Tracking, Subscriptions, Notifications (`src/infrastructure/`)
- Theme-Tokens und wiederverwendbare UI-Bausteine (`src/ui/`)

### Optional (`src/features/optional/`)

Behalten oder löschen bei neuer App. Siehe [New App Setup](./new-app-setup.md) Schritt 5.

- Kalender mit Daily Notes / Mood Tracking
- Statistics (Platzhalter)

### Showcase (`src/features/_showcase/`)

Referenz-Implementierungen (BottomSheet, WheelPicker, Cards, etc.). Nur im Dev-Modus sichtbar. Patterns anschauen, kopieren, Ordner löschen.

### App-spezifisch (`src/features/app-specific/`)

Hier kommt die eigentliche App-Logik rein. Jedes Feature bekommt einen eigenen Ordner.

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
| `src/infrastructure/subscriptions/` | RevenueCat-Integration (Facade + Adapter) |
| `src/infrastructure/analytics/` | PostHog-Integration (Facade + Adapter) |
| `src/infrastructure/error-tracking/` | Sentry-Integration |
| `src/infrastructure/notifications/` | Notification-Integration |
| `app/_layout.tsx` | globale Provider |

## Empfohlener Ablauf für neue Apps

1. App-Identität in `src/config/appConfig.ts` setzen
2. `.env.local` aus `.env.local.example` anlegen
3. externe Projekte anlegen: RevenueCat, PostHog, Sentry, optional späterer Deferred-Link-Provider
4. Onboarding-, Home-, Reminder- und Privacy-Copy ersetzen
5. `npm run template:audit` laufen lassen
6. `eas init` bzw. neues EAS-Projekt aufsetzen

## Weiterführende Doku

- [New App Setup](./new-app-setup.md)
- [Template Updates](./template-updates.md) -- Apps mit dem Template synchron halten
- [Integrations](./integrations.md)
- [Rename Checklist](./rename-checklist.md)
- [Template Strategy](./strategy.md)
