# Expo App Template

Generisches Expo/React-Native-Template mit:

- Onboarding inklusive Placeholder-Flows
- RevenueCat-Paywall und Subscription-Handling
- Trial-Reminder-Notifications
- Kalender-/Journal-Modul
- Settings, Theme, Bottom Sheets und Example-Screens

## Aktueller Stand

Dieses Repo ist bewusst auf ein Template reduziert:

- `Home` ist nur noch ein Placeholder
- `Statistics` ist standardmäßig ausgeblendet
- BAC-/Drinktracker-spezifische Texte sind aus den Hauptscreens entfernt
- Subscription-, Reminder- und Dev-Tools bleiben erhalten

## Wichtige Stellen zum Anpassen

- `src/config/appConfig.ts`
  App-Name, Support-Mail und Legal-URLs
- `src/config/featureFlags.ts`
  Tabs, Paywall, Reminder und optionale Module
- `app/onboarding.tsx`
  Reihenfolge und Verhalten des Onboardings
- `src/ui/components/onboarding/*`
  Placeholder-Copy für Emotional Hook, Science/Feature, Personalization und Motivation
- `app/(tabs)/index.tsx`
  Zukünftiger echter Home-Screen
- `app/(tabs)/settings.tsx`
  Template-Settings, Subscription und Reminder-Testtools

## Start

```bash
npm install
npm start
```

## Template-Hinweise

- Prüfe `src/config/featureFlags.ts` vor jedem Build.
- Ersetze die Placeholder-Texte in Onboarding, Reminder und Privacy vor Release.
- Aktualisiere Support-Mail, Terms-URL und Privacy-URL in `src/config/appConfig.ts`.
- Wenn du eine neue Stats-Ansicht brauchst, baue sie neu statt die alte Drinktracker-Logik wieder mitzuschleppen.
