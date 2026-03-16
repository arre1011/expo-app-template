# App Store Launch Guide

Dieser Leitfaden dokumentiert den kompletten Prozess zur Veröffentlichung der Drink-Tracking App im Apple App Store.

## Übersicht

**Geschätzter Zeitaufwand:** 10-14 Tage
**Kosten:** $99/Jahr (Apple Developer Program)
**Altersfreigabe:** 17+ (wegen Alkohol-Kontext)

---

## Phase 1: Voraussetzungen & Account-Setup

### Apple Developer Account

- [ ] Apple Developer Account beantragen auf https://developer.apple.com/programs/
- [ ] $99 Jahresgebühr bezahlen
- [ ] Identitätsprüfung abwarten (24-48 Stunden)
- [ ] App Store Connect Zugang bestätigen
- [ ] Team/Organization-Informationen vervollständigen

### Expo/EAS Account

- [ ] Expo Account erstellen (falls noch nicht vorhanden)
- [ ] EAS CLI installieren: `npm install -g eas-cli`
- [ ] EAS Login: `eas login`
- [ ] EAS Build konfigurieren: `eas build:configure`

---

## Phase 2: Rechtliche Dokumente

### Privacy Policy (Pflicht!)

Auch wenn alle Daten lokal bleiben, verlangt Apple eine Privacy Policy.

**Inhalte:**
- [ ] Welche Daten werden gesammelt (Gewicht, Geschlecht, Trinkdaten)
- [ ] Wo werden Daten gespeichert (lokal auf dem Gerät)
- [ ] Keine Weitergabe an Dritte
- [ ] Keine Cloud-Synchronisation
- [ ] Optionale Supabase-Authentifizierung (falls implementiert)
- [ ] Nutzerrechte (Datenlöschung = App deinstallieren)

**Hosting-Optionen:**
- [ ] GitHub Pages (kostenlos, einfach)
- [ ] Eigene Webseite
- [ ] Google Docs (öffentlich)

**Generator-Tools:**
- https://www.freeprivacypolicy.com/
- https://www.privacypolicygenerator.info/

### Terms of Service (Empfohlen)

- [ ] Haftungsausschluss: App ist keine medizinische Software
- [ ] BAC-Werte sind Schätzungen
- [ ] Nicht für Fahrtüchtigkeits-Entscheidungen nutzen
- [ ] Harm-Reduction Fokus betonen
- [ ] Keine Gewährleistung für Genauigkeit

### Support-Kontakt

- [ ] Support-E-Mail einrichten (z.B. support@deine-domain.de)
- [ ] ODER GitHub Issues als Support-Kanal
- [ ] Support-URL für App Store Connect vorbereiten

---

## Phase 3: App-Vorbereitung

### In-App Disclaimer & Hinweise

**Onboarding Disclaimer (Pflicht!):**
- [ ] Sehr prominenter Hinweis beim ersten App-Start
- [ ] "Kein medizinisches Gerät"-Warnung
- [ ] "Nicht für Fahrtüchtigkeit nutzen"-Warnung
- [ ] Harm-Reduction Ansatz erklären
- [ ] Nutzer muss aktiv zustimmen (Button)

**Beispieltext:**
```
⚠️ Wichtiger Hinweis

Diese App ist KEIN medizinisches Gerät und dient ausschließlich
der eigenverantwortlichen Selbstbeobachtung im Sinne der
Harm Reduction.

Die berechneten BAC-Werte sind Schätzungen und können von
tatsächlichen Werten abweichen.

Nutze diese App NIEMALS zur Beurteilung deiner Fahrtüchtigkeit
oder für sicherheitsrelevante Entscheidungen.

Bei Fragen zum Alkoholkonsum wende dich an medizinisches
Fachpersonal.
```

**BAC-Anzeige:**
- [ ] Alle BAC-Werte mit "~" oder "ca." kennzeichnen
- [ ] "Schätzung" neben jedem BAC-Wert anzeigen
- [ ] Niemals "sicher", "ok", "nüchtern" suggerieren
- [ ] Harm-Reduction Wording verwenden

### App Icons

**Erforderliche Größen:**
- [ ] 1024x1024 px (App Store)
- [ ] 180x180 px (iPhone)
- [ ] 120x120 px (iPhone)
- [ ] 87x87 px (iPhone Settings)
- [ ] 60x60 px (iPhone Spotlight)
- [ ] 40x40 px (iPhone Spotlight)
- [ ] 29x29 px (iPhone Settings)

**Design-Anforderungen:**
- Kein Alpha-Kanal
- Keine abgerundeten Ecken (iOS macht das automatisch)
- Keine Text-Overlays mit "Beta", "New" etc.
- Kein Apple Hardware im Icon

**Tools:**
- https://www.appicon.co/ (Generator)
- Figma/Sketch Export

### Launch Screen

- [ ] Launch Screen erstellen (`app.json` konfigurieren)
- [ ] Einfaches Design (z.B. Logo + Hintergrundfarbe)
- [ ] Schnell ladend

### App Screenshots

**Erforderliche Größen:**
- [ ] 6.7" Display (iPhone 15 Pro Max) - mindestens 3 Screenshots
- [ ] 6.5" Display (iPhone 11 Pro Max) - mindestens 3 Screenshots
- [ ] Optional: 5.5" Display (iPhone 8 Plus)

**Inhalt der Screenshots:**
- [ ] Home-Screen mit BAC-Anzeige
- [ ] Drink hinzufügen Modal
- [ ] Kalender/Historie
- [ ] Statistiken (falls implementiert)
- [ ] Disclaimer/Onboarding (optional)

**Tools:**
- Expo/Simulator Screenshots
- https://app-mockup.com/ (für Marketing-Visuals)

### App Beschreibung

**Deutsch:**
- [ ] Titel (max. 30 Zeichen)
- [ ] Untertitel (max. 30 Zeichen)
- [ ] Beschreibung (max. 4000 Zeichen)
- [ ] Keywords (max. 100 Zeichen, Komma-getrennt)
- [ ] Promotional Text (optional, max. 170 Zeichen)

**Englisch (empfohlen für internationale Verfügbarkeit):**
- [ ] Englische Übersetzung aller Texte

**Wichtig für Beschreibung:**
- Harm-Reduction Fokus betonen
- NIEMALS "medizinisch", "genau", "zuverlässig für Fahrtüchtigkeit"
- Features klar beschreiben
- Zielgruppe: verantwortungsbewusste Erwachsene

### Kategorisierung

**Haupt-Kategorie:**
- [ ] Health & Fitness ODER
- [ ] Lifestyle

**Altersfreigabe:**
- [ ] 17+ (wegen "Frequent/Intense Alcohol, Tobacco, or Drug Use or References")

---

## Phase 4: Technische Vorbereitung

### Code Review

- [ ] Alle Debug-Logs entfernen (`console.log`, `console.warn`)
- [ ] TypeScript strict mode ohne Errors
- [ ] ESLint ohne Warnings
- [ ] Keine Entwickler-Kommentare im Production Code

### Testing

- [ ] Unit Tests für BAC-Berechnung laufen durch
- [ ] App startet ohne Crashes
- [ ] Alle Features funktionieren
- [ ] Offline-Modus funktioniert
- [ ] Verschiedene iOS-Versionen testen (mindestens iOS 15+)
- [ ] Verschiedene Bildschirmgrößen testen

### Performance

- [ ] App-Start unter 3 Sekunden
- [ ] Keine Memory Leaks
- [ ] Smooth Scrolling/Animationen
- [ ] Datenbank-Operationen optimiert

### App Configuration

**app.json / app.config.js:**
```json
{
  "expo": {
    "name": "Drink Tracker",
    "slug": "drink-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.drinktracker",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "Nicht verwendet"
      }
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

- [ ] Bundle Identifier festlegen (eindeutig, z.B. `com.deinname.drinktracker`)
- [ ] Version auf 1.0.0 setzen
- [ ] Build Number auf 1 setzen
- [ ] App Name final festlegen

### EAS Build Configuration

**eas.json:**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "deine@email.com",
        "ascAppId": "wird-später-ausgefüllt",
        "appleTeamId": "wird-später-ausgefüllt"
      }
    }
  }
}
```

- [ ] EAS konfiguriert
- [ ] Production Profile getestet

---

## Phase 5: App Store Connect Setup

### App erstellen

- [ ] In App Store Connect einloggen
- [ ] "My Apps" → "+" → "New App"
- [ ] Plattform: iOS
- [ ] App Name eingeben
- [ ] Primary Language: German (DE) oder English (EN)
- [ ] Bundle ID auswählen (muss mit `app.json` übereinstimmen)
- [ ] SKU eingeben (z.B. `drink-tracker-001`)

### App-Informationen

- [ ] Privacy Policy URL eingeben
- [ ] Kategorie wählen
- [ ] Altersfreigabe: 17+
- [ ] Copyright-Informationen
- [ ] Support URL

### Preise & Verfügbarkeit

- [ ] Preis: Kostenlos
- [ ] Verfügbarkeit: Alle Länder ODER nur Deutschland/Schweiz/Österreich

### App Privacy

**Datenerfassung angeben:**
- [ ] "Collect Data": Ja (Name/Gewicht/Geschlecht für lokale BAC-Berechnung)
- [ ] "Track User": Nein
- [ ] "Link to User": Nein
- [ ] Alle gesammelten Datentypen auflisten:
  - Health & Fitness → Body (Gewicht)
  - User Content → Other User Content (Drink-Logs)
- [ ] "Data Use": App Functionality
- [ ] "Data Storage": On Device Only

### Versionsinfos (1.0)

- [ ] Screenshots hochladen (alle erforderlichen Größen)
- [ ] Beschreibung eingeben
- [ ] Keywords eingeben
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Promotional Text (optional)
- [ ] "What's New" für Version 1.0 (z.B. "Erste Version")

---

## Phase 6: Build & Submission

### Production Build erstellen

```bash
# 1. Credentials Setup (falls noch nicht geschehen)
eas credentials

# 2. Production Build erstellen
eas build --platform ios --profile production

# Warte auf Build (15-30 Minuten)
# Du bekommst eine E-Mail wenn fertig
```

- [ ] Build erfolgreich
- [ ] IPA-Datei heruntergeladen (zur Sicherheit)

### TestFlight Upload (Interner Test)

```bash
# Automatisch zu TestFlight submitten
eas submit --platform ios --latest
```

ODER manuell:
- [ ] In App Store Connect → TestFlight
- [ ] Build hochladen via Transporter App
- [ ] Compliance-Fragen beantworten (meist "Nein" bei keiner Verschlüsselung)

**TestFlight Tester:**
- [ ] Interne Tester hinzufügen (deine E-Mail)
- [ ] App auf eigenem Gerät testen
- [ ] Alle Funktionen durchgehen
- [ ] Crashes/Bugs beheben

### App Store Review einreichen

- [ ] In App Store Connect: Version 1.0 → "Submit for Review"
- [ ] Review-Informationen ausfüllen:
  - Kontakt-Informationen
  - Demo-Account (falls Login erforderlich)
  - Notes for Reviewer: "BAC-Berechnungen sind Schätzungen. App enthält klare Disclaimer."
- [ ] Export Compliance: "No" (falls keine Verschlüsselung außer HTTPS)
- [ ] Content Rights: Bestätigen
- [ ] Advertising Identifier: "No" (falls kein Tracking)

- [ ] "Submit" klicken

---

## Phase 7: Review-Prozess

### Während der Review (1-7 Tage)

**Status in App Store Connect überwachen:**
- Waiting for Review
- In Review (meist nur wenige Stunden)
- Pending Developer Release ODER Ready for Sale

**Mögliche Outcomes:**

**✅ Approved:**
- [ ] App ist "Ready for Sale"
- [ ] Wählen: Sofort veröffentlichen oder manuell
- [ ] Feiern!

**⚠️ Metadata Rejected:**
- [ ] Feedback von Apple lesen
- [ ] Meist nur Beschreibung/Screenshots anpassen
- [ ] Erneut submitten (kein neuer Build nötig)

**❌ Binary Rejected:**
- [ ] Feedback von Apple lesen
- [ ] Code-Änderungen vornehmen
- [ ] Neuen Build erstellen
- [ ] Erneut submitten

### Häufige Ablehnungsgründe & Lösungen

**"Missing Privacy Policy":**
- [ ] Privacy Policy URL prüfen
- [ ] Muss öffentlich erreichbar sein

**"Misleading Health Claims":**
- [ ] Alle "genau", "zuverlässig", "medizinisch" entfernen
- [ ] Disclaimer prominenter machen

**"Encourages Dangerous Behavior":**
- [ ] Niemals "safe to drive" suggerieren
- [ ] Harm-Reduction Fokus betonen

**"Incomplete Information":**
- [ ] Alle Felder in App Store Connect ausfüllen
- [ ] Screenshots für alle Größen

**"Crashes or Bugs":**
- [ ] TestFlight besser testen
- [ ] Logs in App Store Connect prüfen

---

## Phase 8: Nach der Veröffentlichung

### Launch

- [ ] App im App Store veröffentlicht
- [ ] App Store Link teilen
- [ ] Feedback-Kanal einrichten (E-Mail/GitHub)

### Monitoring

- [ ] App Store Connect Analytics checken
- [ ] Crash-Reports überwachen
- [ ] User-Reviews lesen und beantworten

### Updates

**Für Updates (Version 1.1, 1.2, etc.):**
- [ ] Version in `app.json` erhöhen
- [ ] Build Number erhöhen
- [ ] Neuen Build erstellen: `eas build --platform ios --profile production`
- [ ] Zu App Store Connect submitten
- [ ] "What's New" ausfüllen
- [ ] Review einreichen

---

## Wichtige Links

### Apple
- Apple Developer Portal: https://developer.apple.com/
- App Store Connect: https://appstoreconnect.apple.com/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

### Expo/EAS
- EAS Build Dokumentation: https://docs.expo.dev/build/introduction/
- EAS Submit Dokumentation: https://docs.expo.dev/submit/introduction/
- App Store Deployment Guide: https://docs.expo.dev/deploy/submit-ios/

### Tools
- Privacy Policy Generator: https://www.freeprivacypolicy.com/
- App Icon Generator: https://www.appicon.co/
- Screenshot Generator: https://www.app-mockup.com/

---

## Checkliste: Quick Reference

### Pre-Launch (vor Submission)
- [ ] Apple Developer Account aktiv
- [ ] Privacy Policy online
- [ ] Support-Kontakt eingerichtet
- [ ] In-App Disclaimer implementiert
- [ ] App Icons alle Größen
- [ ] Screenshots erstellt
- [ ] App Beschreibung geschrieben
- [ ] Bundle ID festgelegt
- [ ] TestFlight intern getestet

### Submission Day
- [ ] Production Build erfolgreich
- [ ] TestFlight Upload erfolgreich
- [ ] App Store Connect ausgefüllt
- [ ] Review eingereicht

### Post-Launch
- [ ] App veröffentlicht
- [ ] Analytics eingerichtet
- [ ] Feedback-Monitoring aktiv

---

## Zeitplan-Beispiel

| Tag | Aufgabe |
|-----|---------|
| 1 | Apple Developer Account beantragen |
| 2-3 | Privacy Policy schreiben & hosten |
| 4-5 | In-App Disclaimer implementieren |
| 6 | App Icons & Screenshots erstellen |
| 7 | App Beschreibung schreiben |
| 8 | App Store Connect Setup |
| 9 | Production Build & TestFlight |
| 10 | Interner Test |
| 11 | Review Submission |
| 12-18 | Apple Review |
| 19 | Launch! 🎉 |

---

**Letzte Aktualisierung:** 2025-12-30
**Version:** 1.0

Bei Fragen oder Problemen: Apple Developer Support oder Expo Discord konsultieren.
