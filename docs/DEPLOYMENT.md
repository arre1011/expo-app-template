# Deployment & Build Documentation

## Übersicht

Diese Dokumentation beschreibt den kompletten Build- und Deployment-Prozess der Drink Tracker App von der lokalen Entwicklung bis zur Production-Veröffentlichung über TestFlight.

---

## Wichtige Plattformen & Tools

### Expo
React Native Framework, das die Entwicklung vereinfacht. Bietet vorgefertigte Module, automatisches Bundling und einen Development Server.

### EAS (Expo Application Services)
Cloud-Build-Service von Expo. Baut iOS/Android Apps in der Cloud ohne lokalen Mac/Xcode. Managed automatisch Signing, Provisioning und Uploads.

### App Store Connect
Apple's Plattform zum Verwalten von iOS Apps. Hier werden Builds hochgeladen, TestFlight konfiguriert und Apps zum App Store submitted.

### TestFlight
Apple's Beta-Testing-Plattform. Ermöglicht interne und externe Tests vor der App Store Veröffentlichung.

### RevenueCat
Cross-Platform In-App-Purchase und Subscription Management. Vereinheitlicht Apple StoreKit und Google Play Billing.

---

## Build Stages & Environment Strategy

### Development (`.dev`)
- **Bundle ID:** `com.drinktracking.app.dev`
- **Zweck:** Lokale Entwicklung mit Hot Reload
- **Platform:** Lokaler Build via `npx expo run:ios`
- **Zielgruppe:** Entwickler

### Preview (TestFlight)
- **Bundle ID:** `com.drinktracking.app`
- **Zweck:** Interne Beta-Tests
- **Platform:** EAS Build → App Store Connect → TestFlight
- **Zielgruppe:** Interne Tester (bis zu 100)

### Production (App Store)
- **Bundle ID:** `com.drinktracking.app`
- **Zweck:** Öffentliche App Store Releases
- **Platform:** EAS Build → App Store Connect → App Store
- **Zielgruppe:** Alle Nutzer

**Warum verschiedene Bundle IDs?**
Development und Production können so parallel auf demselben Gerät installiert werden.

---

## Projekt-Konfiguration

### Wichtige Dateien

#### `app.json`
Expo-Hauptkonfiguration mit Metadaten, Bundle IDs, Icons, Permissions.

```json
{
  "expo": {
    "name": "Drink Tracker",
    "slug": "drink-tracking",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.drinktracking.app"
    }
  }
}
```

#### `eas.json`
EAS Build Profile-Konfiguration. Definiert verschiedene Build-Varianten.

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store",
      "autoIncrement": true
    }
  }
}
```

**Best Practice:**
- `development`: Development Client für schnelle Iteration
- `preview`: Interne TestFlight Builds
- `production`: App Store Releases mit automatischem Build-Nummer-Increment

---

## App Starten (Lokale Entwicklung)

### 1. iOS Simulator

```bash
# Metro Bundler starten
npx expo start

# Im Terminal 'i' drücken oder:
npx expo start --ios
```

**Vorteil:** Schnell, kein physisches Gerät nötig
**Nachteil:** Keine native Hardware (Kamera, Push Notifications)

### 2. Web (Browser)

```bash
npx expo start --web
# oder im Terminal 'w' drücken
```

**Vorteil:** Sofortiges Testing ohne Build
**Nachteil:** Nicht alle native Features verfügbar

### 3. Physisches iPhone (Development Build)

```bash
# iPhone per USB verbinden
npx expo run:ios --device

# Nach dem ersten Build:
npx expo start
# App startet automatisch
```

**Vorteil:** Echtes Device-Testing mit allen Features
**Nachteil:** Langsamer Build beim ersten Mal (~5-10 Min)

---

## Deployment-Prozess

### TestFlight Build (Preview)

**1. Build in der Cloud erstellen:**

```bash
eas build --platform ios --profile preview
```

**Was passiert:**
- ✅ Code wird zu EAS hochgeladen
- ✅ Build läuft in der Cloud (~10-15 Min)
- ✅ Automatisches Signing mit Apple Developer Account
- ✅ `.ipa` Datei wird generiert

**2. Zu App Store Connect submitten:**

```bash
eas submit --platform ios --latest
```

**Was passiert:**
- ✅ Build wird zu App Store Connect hochgeladen
- ✅ Automatisch in TestFlight verfügbar (~5-10 Min)
- ✅ Erscheint in TestFlight App auf dem iPhone

**3. In TestFlight testen:**

1. TestFlight App öffnen (mit selber Apple ID wie Developer Account)
2. App erscheint automatisch unter "Apps Available to Test"
3. "Install" tippen
4. App läuft wie eine normale App

### Production Build (App Store)

**1. Build erstellen:**

```bash
eas build --platform ios --profile production
```

**2. Zu App Store Connect submitten:**

```bash
eas submit --platform ios --latest
eas submit --platform ios --profile production
```

**3. App Store Review:**

1. Zu [App Store Connect](https://appstoreconnect.apple.com) gehen
2. App auswählen
3. Neue Version erstellen
4. Screenshots, Beschreibung, Keywords hinzufügen
5. "Submit for Review"
6. Warten auf Apple Review (~1-3 Tage)
7. Bei Approval: App geht live

---

## Android Deployment

### Voraussetzungen

1. **Google Play Developer Account** ($25 einmalig)
2. **Service Account Key** (`google-service-account.json` im Root-Verzeichnis)
   - Erstellt über Google Cloud Console
   - In Google Play Console unter API-Zugriff eingerichtet

### Preview Build (Internal Testing)

**1. Build erstellen:**

```bash
eas build --platform android --profile preview
```

**2. Zu Google Play Console submitten:**

```bash
eas submit --platform android --latest
```

Build landet auf dem **Internal Testing Track** (laut `eas.json` Konfiguration).

### Production Build (Google Play Store)

**1. Build erstellen:**

```bash
eas build --platform android --profile production
```

**2. Zu Google Play Console submitten:**

```bash
# Standard: Internal Track
eas submit --platform android --latest

# Direkt zu Production Track
eas submit --platform android --latest --track production
```

**Track-Optionen:**
- `internal` - Internes Testing (bis zu 100 Tester, schnell)
- `alpha` - Closed Testing (eingeladene Tester)
- `beta` - Open Testing (öffentliche Beta)
- `production` - Production Release (für alle Nutzer)

### Google Play Console

**URL:** https://play.google.com/console

1. App auswählen
2. Testing → Internal testing (oder Production)
3. "Create new release"
4. Build auswählen
5. Release notes hinzufügen
6. "Start rollout"

---

## Beide Plattformen gleichzeitig

### Kompletter Release-Workflow

```bash
# 1. Tests laufen lassen
npm test

# 2. Build + Submit für beide Plattformen
eas build --platform all --profile production --auto-submit
```

Das erstellt parallel einen iOS und Android Build und submitted beide automatisch:
- iOS → App Store Connect (TestFlight)
- Android → Google Play Console (Internal Track)

### Nur Builds erstellen (ohne Submit)

```bash
eas build --platform all --profile production
```

### Nur bestehende Builds submitten

```bash
# Neueste Builds submitten
eas submit --platform all --latest

# Spezifische Build-IDs submitten
eas submit --platform all --id <IOS_BUILD_ID> --id <ANDROID_BUILD_ID>
```

---

## Wichtige Links & Dashboards

### Expo Dashboard
**URL:** https://expo.dev/accounts/renearnegger

**Funktion:**
- Übersicht aller Builds (Status, Logs, Downloads)
- Build-Historie
- Project Settings
- Environment Variables

### App Store Connect
**URL:** https://appstoreconnect.apple.com/teams/44d5e475-9bf1-455b-b572-4fc0c3952fb3/apps/6757349935/testflight/ios

**Funktion:**
- TestFlight Build Management
- Interne/Externe Tester verwalten
- App Store Releases
- Analytics & Crash Reports
- In-App-Purchases konfigurieren

### Zusammenspiel Expo ↔ App Store Connect

```
┌─────────────┐
│  EAS Build  │  ← Code wird gebaut
└──────┬──────┘
       │
       ↓ eas submit
┌─────────────────────┐
│ App Store Connect  │  ← .ipa wird hochgeladen
└──────┬──────────────┘
       │
       ├─→ TestFlight  ← Beta Testing
       │
       └─→ App Store   ← Production Release
```

1. **EAS Build** erstellt die `.ipa` Datei in der Cloud
2. **eas submit** lädt die `.ipa` zu App Store Connect hoch
3. **App Store Connect** macht den Build in TestFlight verfügbar
4. **TestFlight** erlaubt Beta-Testing
5. Vom gleichen Build kann dann zum **App Store** submitted werden

---

## Troubleshooting

### "No script URL provided" Fehler
**Problem:** Development Client läuft, aber Metro Bundler ist nicht erreichbar
**Lösung:** `npx expo start` in separatem Terminal starten

### "Security Delay in Progress" auf iPhone
**Problem:** iOS verzögert Installation von Development Profiles
**Lösung:** 1-24h warten oder EAS Build nutzen (kein lokales Profile nötig)

### Build schlägt fehl: "bundleIdentifier not allowed"
**Problem:** Bundle ID Überschreibung in falscher `eas.json` Sektion
**Lösung:** Bundle ID nur in `app.json` definieren, nicht in `eas.json`

### TestFlight zeigt keine App
**Problem:** Build wurde nicht submitted oder falscher Apple ID
**Lösung:**
1. `eas submit --platform ios --latest` ausführen
2. Mit selber Apple ID in TestFlight einloggen wie im Developer Account

---

## Best Practices

### 1. Environment Variables
Nutze EAS Secrets für sensible Daten (API Keys, RevenueCat Keys):

```bash
eas secret:create --name REVENUECAT_API_KEY --value "sk_..."
```

### 2. Automatische Build-Nummern
`"autoIncrement": true` in production profile aktivieren:

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 3. Git Workflow
Vor jedem Build committen:

```bash
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push --tags
```

### 4. Testing Strategy
- **Development:** Schnelles Testen im Simulator
- **Preview (TestFlight):** Beta-Testing auf echten Geräten
- **Production:** Finale Tests vor App Store Release

### 5. Version Management
- **Version** (`app.json`): Nutzer-sichtbar (1.0.0)
- **Build Number**: Intern, automatisch inkrementiert (1, 2, 3, ...)

---

## Schnellreferenz

### Lokale Entwicklung
```bash
npx expo start                    # Metro Bundler starten
npx expo start --ios              # iOS Simulator
npx expo start --android          # Android Emulator
npx expo run:ios --device         # iPhone per USB
npx expo run:android --device     # Android per USB
```

### EAS Builds - Beide Plattformen gleichzeitig
```bash
# Build für iOS + Android gleichzeitig
eas build --platform all --profile production

# Submit für iOS + Android gleichzeitig
eas submit --platform all

# Build + Submit in einem Schritt (empfohlen für Releases)
eas build --platform all --profile production --auto-submit
```

### EAS Builds - iOS
```bash
eas build --platform ios --profile preview     # TestFlight Build
eas build --platform ios --profile production  # Production Build
eas submit --platform ios --latest             # Zu App Store hochladen
eas submit --platform ios                      # Interaktive Auswahl
```

### EAS Builds - Android
```bash
eas build --platform android --profile preview     # Internal Testing Build
eas build --platform android --profile production  # Production Build
eas submit --platform android --latest             # Zu Google Play hochladen
eas submit --platform android                      # Interaktive Auswahl
```

### Build + Submit kombiniert
```bash
# Alles in einem Befehl - EMPFOHLEN für Releases
eas build --platform all --profile production --auto-submit

# Nur iOS
eas build --platform ios --profile production --auto-submit

# Nur Android
eas build --platform android --profile production --auto-submit
```

### Status prüfen
```bash
eas build:list                    # Letzte Builds anzeigen
eas build:view [BUILD_ID]         # Build-Details
```

---

## Notizen

- **Apple Developer Account:** $99/Jahr erforderlich
- **EAS Free Tier:** 30 Builds/Monat kostenlos
- **TestFlight Limits:** 100 interne Tester, 10.000 externe Tester
- **App Store Review:** Durchschnittlich 1-3 Tage
- **Build-Dauer:** ~10-15 Minuten (EAS), ~5-10 Minuten (lokal)

---

*Letzte Aktualisierung: 20.01.2026*
