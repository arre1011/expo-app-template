# Store Launch Checkliste

Priorisierte Checkliste für die Veröffentlichung im Apple App Store und Google Play Store.

**Stand:** Januar 2025
**App:** Drink Tracker (BAC Tracking & Harm Reduction)

---

## Aktueller Status

| Bereich | iOS | Android | Bemerkung |
|---------|-----|---------|-----------|
| App Icon | ❌ | ❌ | Nur Platzhalter |
| Screenshots | ❌ | ❌ | Fehlen komplett |
| Privacy Policy (in-app) | ✅ | ✅ | Vorhanden |
| Privacy Policy URL (Web) | ❌ | ❌ | Muss gehostet werden |
| Terms of Service | ❌ | ❌ | Fehlt komplett |
| Store Account | ✅ | ❌ | Play Console fehlt |
| Subscriptions | ✅ | ❌ | Nur iOS konfiguriert |
| TestFlight/Internal Test | ✅ | ❌ | |

---

## Phase 1: Kritische Blocker (MUSS vor Submit)

### 1.1 App Icon erstellen
- [ ] **Design erstellen** (professionell, erkennbar, zum Thema passend)
- [ ] **iOS Version:** 1024×1024 PNG, keine Transparenz, kein Alpha-Kanal
- [ ] **Android Version:** 512×512 PNG, 32-bit mit Alpha erlaubt
- [ ] Adaptive Icon für Android (Foreground + Background Layer)
- [ ] Icon in `assets/` ersetzen und in `app.json` referenzieren

**Tools:** [AppIcon.co](https://appicon.co), Figma, oder Designer beauftragen

### 1.2 Privacy Policy hosten
- [ ] Inhalt aus `app/(modals)/privacy-policy.tsx` als HTML/Markdown exportieren
- [ ] **RevenueCat erwähnen** (verarbeitet Kaufdaten)
- [ ] Hosting wählen:
  - [ ] Option A: GitHub Pages (kostenlos)
  - [ ] Option B: Eigene Domain
  - [ ] Option C: Notion Public Page
- [ ] URL notieren: `https://_______________`
- [ ] URL in App Store Connect eintragen
- [ ] URL in Google Play Console eintragen

### 1.3 Terms of Service erstellen
- [ ] Nutzungsbedingungen schreiben (oder Generator nutzen)
- [ ] **Wichtige Punkte:**
  - [ ] BAC-Werte sind Schätzungen
  - [ ] Keine Fahreignungs-Empfehlung
  - [ ] Mindestalter (gesetzliches Trinkalter)
  - [ ] Subscription-Bedingungen
- [ ] Als Webseite hosten
- [ ] URL notieren: `https://_______________`

### 1.4 Age Rating konfigurieren (KRITISCH!)
- [ ] **iOS:** App Store Connect → Age Rating → "Alcohol, Tobacco, or Drug Use" = **Frequent/Intense**
- [ ] **Android:** IARC Fragebogen → Alkohol-Referenzen = **Ja**
- [ ] Erwartetes Rating: **17+** (iOS) / **PEGI 16-18** (Android)

> ⚠️ WICHTIG: Alkohol-Apps MÜSSEN als 17+ eingestuft werden, sonst Rejection!

### 1.5 Kontakt-Informationen
- [ ] Support-Email festlegen: `_______________@_____.___`
- [ ] Email in Privacy Policy eintragen
- [ ] Email in App Store Connect eintragen
- [ ] Email in Google Play Console eintragen

---

## Phase 2: Store-Listing Assets

### 2.1 Screenshots erstellen

#### iOS (Pflicht)
- [ ] **iPhone 6.9"** (1290×2796 px) - PFLICHT seit 2025
  - [ ] Screenshot 1: Home Screen mit BAC-Anzeige
  - [ ] Screenshot 2: Drink hinzufügen
  - [ ] Screenshot 3: Kalender-Ansicht
  - [ ] Screenshot 4: Statistiken
  - [ ] Screenshot 5: Einstellungen/Pro Features
- [ ] **iPad 13"** (2064×2752 px) - nur wenn `supportsTablet: true`
  - [ ] Gleiche 5 Screens wie iPhone

#### Android (Pflicht)
- [ ] **Phone Screenshots** (min. 2, empfohlen 5-8)
  - [ ] Gleiche Screens wie iOS
  - [ ] Min. 320px, Max. 3840px Höhe

**Screenshot-Regeln:**
- Nur echte App-Screens (keine Mockups mit Händen/Geräten laut Apple 2025)
- Text-Overlays erlaubt
- Keine irreführenden Inhalte

**Tools:**
- Screenshots direkt vom Simulator/Gerät
- [Previewed.app](https://previewed.app) für Mockups
- [AppScreens](https://appscreens.com) für Layouts

### 2.2 Feature Graphic (nur Android)
- [ ] **1024×500 px** JPEG oder PNG (kein Alpha)
- [ ] Kein Text wie "Top App", "Sale", Preise
- [ ] App-Name und kurze Beschreibung OK
- [ ] Wird im Play Store prominent angezeigt

### 2.3 App Preview Video (optional, empfohlen)
- [ ] iOS: Gleiche Auflösung wie Screenshots
- [ ] Android: YouTube-Link oder direkt hochladen
- [ ] 15-30 Sekunden, zeigt Hauptfeatures

---

## Phase 3: Store-Texte schreiben

### 3.1 App Name
- [ ] **Finalen Namen wählen** (max. 30 Zeichen iOS, 50 Android)
- [ ] Vorschläge prüfen:
  - "Drink Monitor"
  - "BAC Tracker"
  - "Drink Tracker"
  - Eigene Idee: `_______________`
- [ ] Verfügbarkeit in beiden Stores prüfen

### 3.2 Subtitle / Tagline
- [ ] **iOS Subtitle** (max. 30 Zeichen): `_______________`
- [ ] Vorschläge:
  - "Track drinks & estimate BAC"
  - "Mindful drinking tracker"
  - "BAC estimation & limits"

### 3.3 Kurzbeschreibung
- [ ] **Android Short Description** (max. 80 Zeichen)
- [ ] Vorschlag:
  ```
  Track your drinks, estimate BAC, and set personal limits. Harm reduction focused.
  ```

### 3.4 Vollständige Beschreibung
- [ ] **Deutsch** (max. 4000 Zeichen)
- [ ] **Englisch** (max. 4000 Zeichen)

**Template:**
```
[App Name] hilft dir, deinen Alkoholkonsum achtsam zu überwachen.

⚠️ WICHTIG: Diese App ersetzt KEINE medizinische Beratung und darf
NICHT zur Beurteilung der Fahrtüchtigkeit verwendet werden.
Alle BAC-Werte sind Schätzungen.

FEATURES:
• Schnelles Drink-Logging
• BAC-Schätzung in Echtzeit
• Persönliche Limits setzen
• Kalender mit Verlauf
• Statistiken & Insights

PRO FEATURES (14 Tage kostenlos):
• Erweiterte Statistiken
• Unbegrenzter Verlauf
• [weitere Pro-Features]

Die App speichert alle Daten lokal auf deinem Gerät.
Kein Account erforderlich, keine Cloud-Synchronisation.

---
Entwickelt mit Fokus auf Harm Reduction und Selbstbestimmung.
```

### 3.5 Keywords (nur iOS)
- [ ] **Max. 100 Zeichen**, kommagetrennt
- [ ] Vorschlag:
  ```
  alcohol,bac,tracker,drinking,health,promille,limit,harm reduction
  ```

---

## Phase 4: iOS-spezifische Schritte

### 4.1 App Store Connect Einstellungen
- [ ] Kategorie: **Health & Fitness**
- [ ] Sekundäre Kategorie: **Lifestyle**
- [ ] Preis: **Free** (Freemium mit IAP)
- [ ] Verfügbarkeit: Alle Länder (oder einschränken)
- [ ] Privacy Policy URL eintragen
- [ ] Support URL eintragen

### 4.2 In-App Purchases prüfen
- [ ] Products in App Store Connect vorhanden
- [ ] Product IDs stimmen mit RevenueCat überein
- [ ] Trial-Periode konfiguriert (14 Tage)
- [ ] Subscription-Beschreibungen ausgefüllt
- [ ] Review-Screenshot für Subscription hochgeladen

### 4.3 Review Notes vorbereiten
```
App Purpose:
This app helps users track alcoholic drinks and estimate blood alcohol
concentration (BAC) for harm reduction purposes.

IMPORTANT DISCLAIMERS (visible in app):
- BAC values are clearly marked as estimates
- App explicitly states it must NOT be used to judge fitness to drive
- Follows harm reduction approach - no promotion of excessive consumption

AGE RESTRICTION:
App is rated 17+ due to alcohol content tracking.

SUBSCRIPTION TESTING:
1. Navigate to Settings → "Upgrade to Pro"
2. Select any subscription plan
3. Trial period: 14 days
4. Restore Purchases: Settings → Manage Subscription

DATA STORAGE:
All data stored locally on device. No server sync, no account required.
```

### 4.4 TestFlight Finales Testing
- [ ] Aktuelle Version auf TestFlight
- [ ] Subscription-Flow mit Sandbox-Account testen
- [ ] Restore Purchases testen
- [ ] Alle Screens auf Crashes prüfen
- [ ] 5-10 externe Tester einladen
- [ ] Feedback einarbeiten

---

## Phase 5: Android-spezifische Schritte

### 5.1 Google Play Console einrichten
- [ ] [Google Play Console](https://play.google.com/console) Account erstellen
- [ ] **$25 Registrierungsgebühr** zahlen
- [ ] Identität verifizieren (Pflicht seit 2024)
- [ ] Developer Program Policies akzeptieren
- [ ] US Export Laws Erklärung akzeptieren

### 5.2 App in Play Console anlegen
- [ ] "Create app" → App-Typ: App (nicht Game)
- [ ] Free or Paid: Free
- [ ] Declarations ausfüllen

### 5.3 Store-Listing ausfüllen
- [ ] App Name
- [ ] Short Description
- [ ] Full Description
- [ ] App Icon hochladen
- [ ] Feature Graphic hochladen
- [ ] Screenshots hochladen
- [ ] Kategorie: Health & Fitness
- [ ] Contact Email
- [ ] Privacy Policy URL

### 5.4 Content Rating (IARC)
- [ ] Fragebogen starten
- [ ] **Alkohol-Referenzen: JA**
- [ ] **Fördert Alkoholkonsum bei Minderjährigen: NEIN**
- [ ] **Zielgruppe: Erwachsene**
- [ ] Rating erhalten und bestätigen

### 5.5 Data Safety ausfüllen
- [ ] "Does your app collect or share user data?" → **Ja**
- [ ] Datentypen:
  - [ ] Personal info (Gewicht, Geschlecht) → **Collected, not shared**
  - [ ] Health info (BAC, Drinks) → **Collected, not shared**
  - [ ] Purchase history → **Collected by RevenueCat**
- [ ] Datenverschlüsselung: **Ja** (lokale SQLite)
- [ ] Nutzer können Daten löschen: **Ja** (App deinstallieren)

### 5.6 Target Audience
- [ ] **Nicht für Kinder** auswählen
- [ ] Ads: Nein
- [ ] News app: Nein

### 5.7 In-App Products einrichten
- [ ] Monetization → Products → Subscriptions
- [ ] Subscription Group erstellen
- [ ] Products erstellen (matching RevenueCat IDs):
  - [ ] `monthly` - Monatlich
  - [ ] `yearly` - Jährlich
  - [ ] `lifetime` - Einmalkauf
- [ ] Preise festlegen
- [ ] RevenueCat mit Play Console verbinden

### 5.8 Android Build erstellen
```bash
# Production Build für Play Store
eas build --platform android --profile production

# Direkter Upload zu Play Console
eas submit --platform android
```

### 5.9 Internal Testing
- [ ] Internal Testing Track einrichten
- [ ] Tester-Emails hinzufügen
- [ ] AAB hochladen
- [ ] License Testers für Subscription-Tests konfigurieren
- [ ] Alle Flows testen

---

## Phase 6: Finale Prüfung vor Submit

### Pre-Submit Checklist iOS
- [ ] Alle Screenshots hochgeladen
- [ ] App Icon korrekt (kein Platzhalter!)
- [ ] Privacy Policy URL erreichbar
- [ ] Terms of Service URL erreichbar
- [ ] Age Rating: 17+
- [ ] Review Notes ausgefüllt
- [ ] Subscription-Info vollständig
- [ ] Keine TestFlight Crashes
- [ ] Version Number korrekt

### Pre-Submit Checklist Android
- [ ] Alle Assets hochgeladen
- [ ] Store-Listing komplett
- [ ] Content Rating abgeschlossen
- [ ] Data Safety ausgefüllt
- [ ] Target Audience konfiguriert
- [ ] In-App Products aktiv
- [ ] Internal Testing erfolgreich
- [ ] AAB signiert und hochgeladen

---

## Zeitschätzung

| Phase | Aufwand |
|-------|---------|
| Phase 1 (Blocker) | 1-2 Tage |
| Phase 2 (Assets) | 2-3 Tage |
| Phase 3 (Texte) | 1 Tag |
| Phase 4 (iOS) | 1-2 Tage |
| Phase 5 (Android) | 2-3 Tage |
| Phase 6 (Testing) | 2-3 Tage |
| **Apple Review** | 1-3 Tage |
| **Google Review** | 1-7 Tage |

**Gesamtzeit bis Launch:** ca. 2-3 Wochen

---

## Häufige Ablehnungsgründe (vermeiden!)

### Apple App Store
1. ❌ App crashes beim Start
2. ❌ Falsche/irreführende Screenshots
3. ❌ Privacy Policy nicht erreichbar
4. ❌ Restore Purchases fehlt oder versteckt
5. ❌ Falsches Age Rating bei Alkohol-Content
6. ❌ Subscription-Preise nicht klar sichtbar

### Google Play Store
1. ❌ Falsches Content Rating
2. ❌ Data Safety nicht/falsch ausgefüllt
3. ❌ Als "für Kinder geeignet" markiert
4. ❌ In-App Purchases außerhalb Google Play Billing
5. ❌ Irreführende Store-Beschreibung
6. ❌ Feature Graphic mit verbotenen Inhalten

---

## Nützliche Links

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/)
- [Google Play Developer Policy](https://support.google.com/googleplay/android-developer/topic/9858052)
- [IARC Content Ratings](https://support.google.com/googleplay/answer/6209544)
- [RevenueCat Docs](https://docs.revenuecat.com/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)

---

## Notizen

_Platz für eigene Notizen während der Umsetzung:_

```
Privacy Policy URL:
Terms of Service URL:
Support Email:
Finaler App Name:
```
