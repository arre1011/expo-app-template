# New App Setup

Diese Schritte solltest du nach dem Erstellen eines neuen Repos aus dem Template einmal komplett durchgehen.

Wenn du bei einem externen Dienst hängen bleibst, spring direkt in [Integrations](/Users/rene/IdeaProjects/expo-app-template/docs/template/integrations.md). Vor dem ersten Release solltest du zusätzlich die [Rename Checklist](/Users/rene/IdeaProjects/expo-app-template/docs/template/rename-checklist.md) abarbeiten.

## 1. App-Identität setzen

Bearbeite [src/config/appConfig.ts](/Users/rene/IdeaProjects/expo-app-template/src/config/appConfig.ts):

- `appName`
- `slug`
- `scheme`
- `ios.bundleIdentifier`
- `android.package`
- `supportEmail`
- `legal.termsUrl`
- `legal.privacyUrl`
- `integrations.sentry.organization`
- `integrations.sentry.project`
- `integrations.revenueCat.entitlementId`
- `integrations.revenueCat.productIds`

Danach zieht [app.config.ts](/Users/rene/IdeaProjects/expo-app-template/app.config.ts) die Expo-Konfiguration automatisch nach.

## 2. Env-Datei anlegen

```bash
cp .env.local.example .env.local
```

Dann fülle aus:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_DEEPLINKNOW_API_KEY`
- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST`
- `EXPO_PUBLIC_SENTRY_DSN`

## 3. EAS-Projekt neu anlegen

Das Template enthält absichtlich kein fest verdrahtetes `projectId`.

Für eine neue App:

```bash
eas init
```

oder das Projekt im gewünschten Workflow mit EAS verbinden und anschließend `app.config.ts` ergänzen, falls du `extra.eas.projectId` bewusst im Repo halten willst.

## 4. Externe Dienste pro App neu anlegen

Nicht wiederverwenden:

- altes PostHog-Projekt
- altes Sentry-Projekt
- alte RevenueCat-App
- alte DeepLinkNow-App
- alte Store-Credentials

Warum: saubere Daten, saubere Fehleranalyse, kein Vermischen mehrerer Apps.

## 5. Placeholder-Copy ersetzen

Mindestens prüfen:

- `app/(tabs)/index.tsx`
- `app/onboarding.tsx`
- `src/ui/components/onboarding/*`
- `app/trial-reminder.tsx`
- `app/(modals)/privacy-policy.tsx`
- `app/(tabs)/settings.tsx`

## 6. Assets austauschen

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/favicon.png`

## 7. Audit laufen lassen

```bash
npm run template:audit
```

Der Befehl findet:

- alte Legacy-Bezeichner
- Default-Placeholder in Konfigdateien
- nicht ersetzte Template-IDs

## 8. Erst dann Release vorbereiten

Vor dem ersten Build:

- Bundle ID / Package Name final prüfen
- RevenueCat-Produkt-IDs prüfen
- PostHog- und Sentry-Projekte verifizieren
- Privacy / Terms finalisieren
- Dev-Overrides deaktivieren
