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
- [src/infrastructure/subscriptions/](/Users/rene/IdeaProjects/expo-app-template/src/infrastructure/subscriptions/)
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
- [src/infrastructure/analytics/](/Users/rene/IdeaProjects/expo-app-template/src/infrastructure/analytics/)

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

## Deep Links / Deferred Attribution

Direkte App-Links funktionieren über das URL-Scheme der App. Ein externer Provider ist nur nötig, wenn du wirklich Deferred Deep Links / Install-Attribution brauchst.

Aktueller Stand im Template:

- direkte Deep Links aktiv
- Offer-Routing aktiv
- deferred Provider bewusst nicht eingebaut
- Adapter-Seam vorbereitet für einen späteren Provider wie AppsFlyer

Konfigurationsstellen:

- [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts)
- [src/infrastructure/deep-links/deep-links.ts](/Users/rene/IdeaProjects/expo-app-template/src/infrastructure/deep-links/deep-links.ts)
- [src/infrastructure/deep-links/provider-adapter.ts](/Users/rene/IdeaProjects/expo-app-template/src/infrastructure/deep-links/provider-adapter.ts)
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

Was bewusst im Repo steht:

- App-Namen und IDs
- Product IDs
- Entitlement-ID
- Sentry-Projekt-Metadaten
- Legal-URLs

Das ist Absicht: Identität und Architektur sollen versioniert sein, Secrets nicht.
