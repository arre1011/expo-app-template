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
- alte Store-Credentials

Warum: saubere Daten, saubere Fehleranalyse, kein Vermischen mehrerer Apps.

## 5. Optionale Features auswählen

Das Template enthält drei Kategorien von Features:

| Kategorie | Ordner | Aktion |
|---|---|---|
| **Core** | `src/features/core/` | Behalten -- jede App braucht diese |
| **Optional** | `src/features/optional/` | Behalten oder **löschen** |
| **Showcase** | `src/features/_showcase/` | Anschauen, Patterns kopieren, dann **löschen** |
| **App-spezifisch** | `src/features/app-specific/` | Hier kommt deine App-Logik rein |

### Optionale Features entfernen

Wenn deine App z.B. keinen Kalender braucht:

1. Lösche `src/features/optional/calendar/`
2. Lösche `app/(tabs)/calendar.tsx`
3. Entferne `calendarTab` aus `src/config/featureFlags.ts`
4. Entferne den `calendar` Tab-Eintrag aus `app/(tabs)/_layout.tsx`

Gleiches gilt für `statistics/`.

### Showcase löschen

Der `_showcase/`-Ordner enthält Referenz-Implementierungen (BottomSheet, WheelPicker, Cards, etc.). Schau dir die Patterns an, kopiere was du brauchst, dann:

1. Lösche `src/features/_showcase/`
2. Lösche `app/(tabs)/examples.tsx`
3. Entferne `showcaseTab` aus `src/config/featureFlags.ts`
4. Entferne den `examples` Tab-Eintrag aus `app/(tabs)/_layout.tsx`

## 6. Placeholder-Copy ersetzen

Mindestens prüfen:

- `app/(tabs)/index.tsx`
- `app/onboarding.tsx`
- `src/ui/components/onboarding/*`
- `app/trial-reminder.tsx`
- `app/(modals)/privacy-policy.tsx`
- `app/(tabs)/settings.tsx`

## 7. Assets austauschen

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/favicon.png`

## 8. Audit laufen lassen

```bash
npm run template:audit
```

Der Befehl findet:

- alte Legacy-Bezeichner
- Default-Placeholder in Konfigdateien
- nicht ersetzte Template-IDs

## 9. Template Remote einrichten

Damit du in Zukunft Template-Updates in diese App mergen kannst:

```bash
git remote add template git@github.com:your-org/expo-app-template.git
git fetch template
```

Details und fortgeschrittene Workflows (Releases, Feature-Branches, Batch-Updates) findest du in [Template Updates](./template-updates.md).

## 10. Erst dann Release vorbereiten

Vor dem ersten Build:

- Bundle ID / Package Name final prüfen
- RevenueCat-Produkt-IDs prüfen
- PostHog- und Sentry-Projekte verifizieren
- Privacy / Terms finalisieren
- Dev-Overrides deaktivieren
