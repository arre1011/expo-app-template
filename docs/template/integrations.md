# Integrations

Diese Datei beantwortet die wichtigste Template-Frage: Was muss pro neuer App neu angelegt oder neu gesetzt werden?

## RevenueCat

Empfehlung: pro App eine eigene RevenueCat-App bzw. ein eigenes Projekt.

Neu pro App:

- iOS API Key
- Android API Key
- App Store / Play Store Zuordnung
- Products
- Offerings

Kann gleich bleiben, wenn du es bewusst standardisieren willst:

- Entitlement-ID, z. B. `pro`
- Product IDs wie `monthly`, `yearly`, `lifetime_pro`

Wichtig:

- Bundle Identifier und Android Package müssen in RevenueCat zur App passen.
- Die Product IDs in RevenueCat müssen mit [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts) übereinstimmen.

Konfigurationsstellen:

- [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts)
- [src/services/revenueCatService.ts](/Users/rene/IdeaProjects/expo-app-template/src/services/revenueCatService.ts)
- `.env.local`

## PostHog

Empfehlung: pro App ein eigenes PostHog-Projekt und damit ein eigener API-Key.

Nicht empfohlen:

- mehrere Apps in ein einzelnes PostHog-Projekt schieben und nur per Event-Property unterscheiden

Grund:

- Funnels, Retention, Feature-Usage und Event-Schemas vermischen sich unnötig
- spätere Analyse wird unklar

Neu pro App:

- PostHog-Projekt
- API-Key
- optional eigener Host, falls nicht `https://eu.i.posthog.com`

Konfigurationsstellen:

- `.env.local` → `EXPO_PUBLIC_POSTHOG_KEY`
- `.env.local` → `EXPO_PUBLIC_POSTHOG_HOST`
- [src/services/analyticsService.ts](/Users/rene/IdeaProjects/expo-app-template/src/services/analyticsService.ts)

## Sentry

Empfehlung: pro App ein eigenes Sentry-Projekt.

Neu pro App:

- DSN
- Projektname
- optional eigene Organisation / Projekt-Metadaten im Expo-Plugin

Konfigurationsstellen:

- `.env.local` → `EXPO_PUBLIC_SENTRY_DSN`
- [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts)
- [app/_layout.tsx](/Users/rene/IdeaProjects/expo-app-template/app/_layout.tsx)
- [app.config.ts](/Users/rene/IdeaProjects/expo-app-template/app.config.ts)

## DeepLinkNow

Nur nötig, wenn du wirklich Deferred Deep Links / Offer-Routing brauchst.

Neu pro App:

- DeepLinkNow-App
- API-Key
- korrektes URL-Scheme

Konfigurationsstellen:

- `.env.local` → `EXPO_PUBLIC_DEEPLINKNOW_API_KEY`
- [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts)
- [src/services/deepLinkService.ts](/Users/rene/IdeaProjects/expo-app-template/src/services/deepLinkService.ts)
- [app.config.ts](/Users/rene/IdeaProjects/expo-app-template/app.config.ts)

## Expo / EAS

Neu pro App:

- EAS-Projekt
- Signing / Credentials
- App Store Connect / Play Console Verbindung

Nicht im Template behalten:

- alte `projectId`
- alte `appleId`
- alte `appleTeamId`
- alte `google-service-account.json`

Darum wurde `eas.json` auf generische Build-Profile reduziert.

## Was ist bewusst env-basiert?

Secrets und per-App-Schlüssel:

- RevenueCat API Keys
- PostHog Key
- Sentry DSN
- DeepLinkNow Key

Was bewusst im Repo steht:

- App-Namen und IDs
- Product IDs
- Entitlement-ID
- Sentry-Projekt-Metadaten
- Legal-URLs

Das ist Absicht: Identität und Architektur sollen versioniert sein, Secrets nicht.
