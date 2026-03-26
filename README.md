# Expo App Template

Ein generisches Expo/React-Native-Template für subscription-basierte Apps mit:

- Expo Router
- Onboarding-Flow mit Placeholder-Screens
- RevenueCat-Paywall
- Trial-Reminder-Notifications
- Kalender-/Journal-Modul
- Theme, Bottom Sheets und Example-Screens

## Schnellstart

1. `npm install`
2. `.env.local.example` nach `.env.local` kopieren
3. App-Identität in [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts) anpassen
4. `npx expo start`
5. `npm run template:audit`

## Empfohlener Ablauf

Wenn du aus dem Template eine neue App machst, geh in dieser Reihenfolge vor:

1. Lies diese `README.md` für den Überblick
2. Arbeite dann [New App Setup](/Users/rene/IdeaProjects/expo-app-template/docs/template/new-app-setup.md) Schritt für Schritt durch
3. Nutze [Integrations](/Users/rene/IdeaProjects/expo-app-template/docs/template/integrations.md) für RevenueCat, PostHog, Sentry und DeepLinkNow
4. Prüfe vor dem ersten Release die [Rename Checklist](/Users/rene/IdeaProjects/expo-app-template/docs/template/rename-checklist.md)

## Single Source Of Truth

Die wichtigste Datei ist [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts).

Dort definierst du:

- App-Name
- `slug`
- URL-`scheme`
- iOS-Bundle-Identifier
- Android-Package-Name
- Support-Mail und Legal-URLs
- RevenueCat-Entitlement und Product-IDs
- Sentry-Projekt-Metadaten

[app.config.ts](/Users/rene/IdeaProjects/expo-app-template/app.config.ts) liest diese Werte und baut daraus die Expo-Konfiguration.

## Integrationen

- RevenueCat: API-Keys über `.env.local`
- PostHog: eigener Key pro App über `.env.local`
- Sentry: eigene DSN pro App über `.env.local`
- DeepLinkNow: eigener Key pro App über `.env.local`

## Wichtige Docs

- [Template Guide](/Users/rene/IdeaProjects/expo-app-template/docs/template/guide.md)
- [New App Setup](/Users/rene/IdeaProjects/expo-app-template/docs/template/new-app-setup.md)
- [Integrations](/Users/rene/IdeaProjects/expo-app-template/docs/template/integrations.md)
- [Rename Checklist](/Users/rene/IdeaProjects/expo-app-template/docs/template/rename-checklist.md)

## Hinweise

- `app.json` wurde bewusst durch [app.config.ts](/Users/rene/IdeaProjects/expo-app-template/app.config.ts) ersetzt.
- `eas.json` enthält nur noch generische Build-Profile. Store-Accounts und Service-Keys gehören nicht ins Template.
- `npm run template:audit` ist bewusst streng und soll vor dem ersten Release einer neuen App rot sein, bis alle Placeholder ersetzt wurden.
