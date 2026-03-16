# App Store Deployment Checklist

Komplette Anleitung für den Launch deiner Drink Tracking App im App Store.

## 📱 Empfohlene Strategie: iOS First

**Ja, starte mit iOS/App Store zuerst:**

✅ **Vorteile:**
- TestFlight ist einfacher als Google Play Internal Testing
- Schnelleres Review-Feedback (meist 24-48h)
- RevenueCat lässt sich leichter mit iOS testen
- Du hast iOS-Geräte zum Testen

✅ **Android später:**
- Nach iOS-Launch hast du mehr Erfahrung
- Kannst Feedback von iOS-Usern einbauen
- Android Emulator reicht für initiale Tests
- Physisches Gerät erst für Pre-Launch wichtig

---

## 🎯 Phase 1: Pre-Launch Vorbereitung

### 1.1 App Code anpassen

#### ✅ RevenueCat Production Setup

**Jetzt (Preview Mode):**
```typescript
// In app/(tabs)/settings.tsx Zeile 174
router.push('/(modals)/paywall-preview')
```

**Für Production:**
```typescript
// Ändere zu:
router.push('/(modals)/paywall-enhanced')
```

**API Key aktualisieren:**
```typescript
// In src/services/revenueCatService.ts:
// VORHER:
const API_KEY = 'test_RIYJBdoDAPQadpVSUJeJekGGsDx';

// NACHHER (nach RevenueCat Dashboard Setup):
const API_KEY = 'appl_xxxxxxxxxxxxx'; // Dein iOS Production Key
```

#### ✅ App Metadata vervollständigen

**In app.json oder app.config.js:**
```json
{
  "expo": {
    "name": "Drink Monitor",
    "slug": "drink-monitoring",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.drinkmonitor",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSUserTrackingUsageDescription": "We use this to provide personalized subscription offers",
        "CFBundleDisplayName": "Drink Monitor"
      }
    },
    "privacy": "public"
  }
}
```

**Was du brauchst:**
- [ ] App Icon (1024×1024 PNG, ohne Transparenz)
- [ ] Splash Screen (1242×2436 PNG)
- [ ] Privacy Policy URL (siehe unten)
- [ ] Terms of Service URL (siehe unten)

#### ✅ App Icons & Assets erstellen

**Benötigte Sizes:**
```
Icon (1024×1024) → App Store
Icon (512×512) → Settings
Icon (180×180) → Home Screen (iPhone)
Icon (120×120) → Home Screen (iPhone smaller)
Splash (1242×2436) → Launch Screen
```

**Tools:**
- [AppIcon.co](https://appicon.co) - Generiert alle Sizes automatisch
- [LaunchIcon](https://www.launchicon.io) - Alternative
- Oder nutze Figma/Sketch Templates

#### ✅ Privacy Policy & Terms erstellen

**Minimalversion (DSGVO-konform):**

Erstelle `privacy-policy.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy - Drink Monitor</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Last updated: [DATUM]</p>

  <h2>1. Data We Collect</h2>
  <ul>
    <li>Drink logs (stored locally on your device)</li>
    <li>User profile (weight, sex - stored locally)</li>
    <li>Purchase information (managed by RevenueCat)</li>
  </ul>

  <h2>2. How We Use Your Data</h2>
  <p>All drink and profile data is stored locally on your device. We do not upload or sync this data to any server.</p>
  <p>Purchase information is processed by RevenueCat to manage your subscription.</p>

  <h2>3. Third-Party Services</h2>
  <ul>
    <li><strong>RevenueCat:</strong> Manages in-app purchases and subscriptions</li>
    <li><strong>Apple:</strong> Processes payments through App Store</li>
  </ul>

  <h2>4. Your Rights</h2>
  <p>You can delete all app data by uninstalling the app. For subscription data, contact us at [EMAIL].</p>

  <h2>5. Contact</h2>
  <p>Email: [DEINE EMAIL]</p>
</body>
</html>
```

**Wo hosten:**
- GitHub Pages (kostenlos, einfach)
- Eigene Website
- Oder nutze [TermsFeed](https://www.termsfeed.com/privacy-policy-generator/) Generator

---

## 🔧 Phase 2: RevenueCat Dashboard Setup

### 2.1 Products in RevenueCat erstellen

**Schritte:**

1. **Gehe zu RevenueCat Dashboard:**
   - [app.revenuecat.com](https://app.revenuecat.com)
   - Erstelle neues Projekt: "Drink Monitor"

2. **Erstelle Products:**

   **Monthly Subscription:**
   ```
   Product ID: monthly
   Name: Monthly Pro
   Description: 14-day free trial, then €3.99/month
   Duration: 1 month
   Trial: 14 days
   Price: €3.99
   ```

   **Yearly Subscription:**
   ```
   Product ID: yearly
   Name: Annual Pro
   Description: 14-day free trial • Save 26%
   Duration: 1 year
   Trial: 14 days
   Price: €34.99
   ```

   **Lifetime Purchase:**
   ```
   Product ID: lifetime
   Name: Lifetime Pro
   Description: One-time payment
   Duration: Lifetime
   Price: €79.99
   ```

3. **Erstelle Entitlement:**
   ```
   Entitlement ID: Drink monitoring Pro
   Description: Unlock all Pro features

   Attached Products:
   - monthly
   - yearly
   - lifetime
   ```

4. **Erstelle Offering:**
   ```
   Offering ID: default
   Description: Main subscription offering

   Packages:
   - monthly (Monthly Pro)
   - yearly (Annual Pro) ⭐ Default
   - lifetime (Lifetime Pro)
   ```

5. **Aktiviere Offering:**
   - Set "default" as Current Offering

### 2.2 App Store Connect Products erstellen

**Wichtig:** Products müssen EXAKT mit RevenueCat übereinstimmen!

1. **Gehe zu App Store Connect:**
   - [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - My Apps → [Deine App] → In-App Purchases

2. **Erstelle Auto-Renewable Subscriptions:**

   **Monthly:**
   ```
   Reference Name: Monthly Pro Subscription
   Product ID: monthly
   Subscription Group: Pro Subscriptions

   Subscription Duration: 1 Month
   Price: €3.99 (Tier 4)

   Free Trial: 14 days
   Subscription Prices:
   - Introductory Offer: Free for 14 days
   ```

   **Yearly:**
   ```
   Reference Name: Annual Pro Subscription
   Product ID: yearly
   Subscription Group: Pro Subscriptions

   Subscription Duration: 1 Year
   Price: €34.99 (Tier 36)

   Free Trial: 14 days
   ```

   **Lifetime:**
   ```
   Reference Name: Lifetime Pro
   Product ID: lifetime
   Type: Non-Consumable In-App Purchase

   Price: €79.99 (Tier 80)
   ```

3. **Subscription Details ausfüllen:**
   ```
   Display Name (DE): Pro Zugang
   Display Name (EN): Pro Access

   Description (DE):
   Schalte erweiterte Statistiken, unbegrenzten Verlauf und
   weitere Pro-Features frei.

   Description (EN):
   Unlock advanced statistics, unlimited history, and more Pro features.
   ```

4. **Review Information:**
   - Screenshot hochladen (Paywall)
   - Review Notes: "14-day free trial, then auto-renewable subscription"

---

## 🏗️ Phase 3: Build für TestFlight

### 3.1 EAS Build Setup (Expo)

**Installiere EAS CLI:**
```bash
npm install -g eas-cli
```

**Login:**
```bash
eas login
```

**Konfiguriere Projekt:**
```bash
eas build:configure
```

**Erstelle eas.json (wird automatisch generiert):**
```json
{
  "build": {
    "preview": {
      "ios": {
        "simulator": false,
        "buildType": "archive"
      }
    },
    "production": {
      "ios": {
        "buildType": "archive",
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "deine@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

### 3.2 Build erstellen

**Production Build:**
```bash
eas build --platform ios --profile production
```

**Was passiert:**
1. ✅ Code wird kompiliert
2. ✅ Dependencies werden gebundelt
3. ✅ Binary wird signiert (mit deinem Apple Developer Account)
4. ✅ .ipa Datei wird erstellt
5. ✅ Upload-ready für TestFlight

**Dauer:** ~10-20 Minuten

### 3.3 Zu TestFlight hochladen

**Option A: Automatisch (empfohlen):**
```bash
eas submit --platform ios
```

**Option B: Manuell:**
1. Download .ipa von EAS Dashboard
2. Öffne Transporter App (Mac)
3. Drag & Drop .ipa
4. Upload zu App Store Connect

---

## 🧪 Phase 4: TestFlight Testing

### 4.1 Internal Testing einrichten

**In App Store Connect:**

1. **TestFlight → Internal Testing:**
   - Create Internal Group: "Team Testing"
   - Add yourself als Tester
   - Add deine Email-Adresse

2. **Build auswählen:**
   - Warte bis Build "Ready to Submit" ist (~10-30 Min)
   - Select Build für Internal Testing

3. **Test Information:**
   ```
   What to Test:
   - Complete onboarding flow
   - Add drinks and verify BAC calculation
   - Test subscription paywall (Sandbox)
   - Verify 14-day trial messaging
   - Test coupon codes (LAUNCH2025)
   - Restore purchases
   ```

4. **Notification an Tester:**
   - TestFlight sendet automatisch Email mit Install-Link

### 4.2 TestFlight App installieren

**Als Tester:**

1. **Install TestFlight App:**
   - Download aus App Store
   - Kostenlos von Apple

2. **Accept Invite:**
   - Email von TestFlight öffnen
   - "View in TestFlight" tippen
   - App installieren

3. **Feedback geben:**
   - Screenshots machen (schüttle iPhone)
   - Feedback direkt in TestFlight
   - Crashes werden automatisch gemeldet

### 4.3 Subscription Testing (Sandbox)

**Sandbox Tester Account erstellen:**

1. **App Store Connect:**
   - Users and Access → Sandbox Testers
   - Create New Sandbox Tester
   ```
   Email: test@example.com (beliebig, muss nicht existieren)
   Password: Test1234!
   First Name: Test
   Last Name: User
   Country: Germany
   ```

2. **Auf iPhone:**
   - Settings → App Store → Sandbox Account
   - Sign out von echtem Apple ID
   - NUR FÜR TESTING!

3. **Purchase testen:**
   ```
   1. Öffne Paywall in TestFlight App
   2. Tippe "Start Free Trial"
   3. Login mit Sandbox Account
   4. Purchase (kostenlos in Sandbox!)
   5. Verify: Pro Features freigeschaltet
   ```

**Sandbox Behavior:**
- Trial dauert 3 Minuten (nicht 14 Tage)
- Subscription erneuert alle 5 Minuten
- Keine echte Zahlung
- Receipts sind Test-Receipts

---

## 🚀 Phase 5: App Store Release

### 5.1 App Store Listing vorbereiten

**In App Store Connect:**

1. **App Information:**
   ```
   Name: Drink Monitor
   Subtitle: BAC Tracking & Harm Reduction

   Category: Health & Fitness
   Secondary: Lifestyle

   Privacy Policy URL: https://yoursite.com/privacy.html
   ```

2. **Pricing & Availability:**
   ```
   Price: Free (Freemium)
   Availability: All Countries
   Pre-Order: No
   ```

3. **App Store Listing (German):**
   ```
   Name: Drink Monitor

   Subtitle:
   Alkoholkonsum tracken & BAC schätzen

   Description:
   Drink Monitor hilft dir, deinen Alkoholkonsum achtsam zu
   überwachen. Tracke Getränke, schätze deine Blutalkohol-
   konzentration und setze dir persönliche Limits.

   ⚠️ Wichtig: Diese App ersetzt KEINE medizinische Beratung
   und darf NICHT zur Beurteilung der Fahrtüchtigkeit verwendet
   werden. Alle BAC-Werte sind Schätzungen.

   Features:
   • Schnelles Drink-Logging
   • BAC-Schätzung in Echtzeit
   • Persönliche Limits setzen
   • Kalender mit Verlauf
   • Statistiken & Insights (Pro)
   • 14 Tage kostenlos testen

   Pro Features:
   • Erweiterte Statistiken
   • Unbegrenzter Verlauf
   • Datenexport
   • Individuelle BAC-Limits
   • Cloud Sync (Coming Soon)

   Keywords:
   alkohol, bac, tracking, gesundheit, harm reduction,
   promille, drinks, limits, statistik
   ```

4. **App Store Listing (English):**
   ```
   Name: Drink Monitor

   Subtitle:
   Track drinks & estimate BAC

   Description:
   Drink Monitor helps you mindfully track your alcohol
   consumption. Log drinks, estimate your blood alcohol
   concentration, and set personal limits.

   ⚠️ Important: This app does NOT replace medical advice
   and must NOT be used to judge fitness to drive. All BAC
   values are estimates.

   Features:
   • Quick drink logging
   • Real-time BAC estimation
   • Set personal limits
   • Calendar with history
   • Statistics & Insights (Pro)
   • 14-day free trial

   Pro Features:
   • Advanced statistics
   • Unlimited history
   • Data export
   • Custom BAC limits
   • Cloud sync (Coming Soon)

   Keywords:
   alcohol, bac, tracking, health, harm reduction,
   drinks, limits, statistics, wellness
   ```

### 5.2 Screenshots erstellen

**Benötigte Sizes:**
```
iPhone 6.7" (iPhone 15 Pro Max): 1290×2796
iPhone 6.5" (iPhone 11 Pro Max): 1242×2688
iPhone 5.5" (iPhone 8 Plus): 1242×2208
```

**Screenshot Strategie:**

1. **Screen 1: Home / BAC Anzeige**
   - Zeige aktuelle BAC-Schätzung
   - Caption: "Schätze deine BAC in Echtzeit"

2. **Screen 2: Drink Logging**
   - Add Drink Modal
   - Caption: "Schnell & einfach Drinks loggen"

3. **Screen 3: Calendar**
   - Kalenderansicht mit History
   - Caption: "Verfolge deinen Konsum über Zeit"

4. **Screen 4: Statistics (Pro)**
   - Charts & Insights
   - Caption: "Erweiterte Statistiken mit Pro"

5. **Screen 5: Paywall**
   - Subscription Angebot
   - Caption: "14 Tage kostenlos testen"

**Tools:**
- [Previewed](https://previewed.app) - Device Mockups
- [Screenshot Studio](https://screenshots.pro) - Auto-Generate
- Figma Template für App Store Screenshots

### 5.3 App Review Information

**In App Store Connect → App Review:**

```
Contact Information:
Email: your@email.com
Phone: +49 xxx xxxxx

Demo Account (optional):
Username: demo@test.com
Password: Demo1234

Notes:
This app helps users track alcoholic drinks and estimate
blood alcohol concentration (BAC) for harm reduction purposes.

IMPORTANT: The app clearly states that BAC values are
estimates and must not be used to judge fitness to drive.

To test subscriptions:
1. Use Sandbox Tester account
2. Navigate to Settings → "Upgrade to Pro"
3. Select any subscription plan
4. Trial period: 14 days

Test coupon code: LAUNCH2025 (30% discount)

The app stores all data locally; no server sync in v1.0.
```

**Attachment:**
- PDF mit Onboarding Screenshots
- Video Demo (optional, aber empfohlen)

### 5.4 Submit for Review

**Checkliste vor Submit:**

- [ ] All Screenshots hochgeladen (5 per Size)
- [ ] App Icon (1024×1024)
- [ ] Privacy Policy URL funktioniert
- [ ] Keywords unter 100 Zeichen
- [ ] Age Rating: 17+ (Alcohol Reference)
- [ ] Subscription Details vollständig
- [ ] Review Notes ausgefüllt
- [ ] TestFlight Testing abgeschlossen
- [ ] Keine Crashes in TestFlight

**Submit:**
1. App Store Connect → Version 1.0
2. "Submit for Review"
3. Confirm all checkboxes
4. Wait for Review (~24-48h)

---

## 📊 Phase 6: Post-Launch

### 6.1 Monitoring

**RevenueCat Dashboard:**
- Überprüfe Trial Starts
- Monitor Conversions
- Track Cancellations

**App Store Connect:**
- Download Zahlen
- Crash Reports
- User Reviews

### 6.2 Update Strategy

**Hotfix Release:**
```bash
# Increment build number
eas build --platform ios --profile production --auto-submit
```

**Feature Updates:**
- Sammle User Feedback (7-14 Tage)
- Priorisiere Bug Fixes
- Release v1.1 nach 2-4 Wochen

---

## 🤖 Android später hinzufügen

### Wann Android starten:

**Nach iOS Launch, wenn:**
- [ ] iOS App ist stabil (keine kritischen Bugs)
- [ ] Erste User Reviews sind positiv
- [ ] RevenueCat funktioniert einwandfrei
- [ ] Du hast ein Android-Gerät zum Testen

### Minimaler Android-Test im Emulator:

**Jetzt schon möglich:**
```bash
# Android Emulator starten
npx expo start --android

# Teste:
1. ✅ Onboarding Flow
2. ✅ Drink Logging
3. ✅ BAC Calculation
4. ✅ UI Rendering
5. ⚠️  Subscription (nur im echten Device testbar)
```

**Was Emulator NICHT kann:**
- ❌ Google Play Billing
- ❌ Echte Subscription Tests
- ❌ Push Notifications
- ❌ Hardware-spezifische Features

**Empfehlung:**
- Teste Basis-Features im Emulator
- Für Production: Leihe Android-Gerät oder nutze Play Store Internal Testing
- Android Subscriptions erfordern physisches Gerät

---

## ✅ Quick Checklist: Ready for App Store?

### Code:
- [ ] `router.push('/(modals)/paywall-enhanced')` statt `-preview`
- [ ] Production API Key in `revenueCatService.ts`
- [ ] `app.json` vollständig ausgefüllt
- [ ] Icons & Splash Screen vorhanden
- [ ] Privacy Policy URL gesetzt

### RevenueCat:
- [ ] Products erstellt (monthly, yearly, lifetime)
- [ ] Entitlement "Drink monitoring Pro" aktiv
- [ ] Offering "default" als Current gesetzt
- [ ] Products in App Store Connect erstellt
- [ ] Product IDs stimmen überein

### App Store Connect:
- [ ] App erstellt
- [ ] In-App Purchases konfiguriert
- [ ] 14-day Trial bei Subscriptions
- [ ] Screenshots hochgeladen (mind. 5)
- [ ] App Description (DE + EN)
- [ ] Age Rating: 17+
- [ ] Review Notes ausgefüllt

### Testing:
- [ ] Internal TestFlight Build verfügbar
- [ ] Sandbox Purchase funktioniert
- [ ] Trial messaging korrekt (14 Tage)
- [ ] Restore Purchases funktioniert
- [ ] Keine kritischen Bugs

### Legal:
- [ ] Privacy Policy erstellt & erreichbar
- [ ] Disclaimer zu BAC-Schätzung vorhanden
- [ ] Harm Reduction Wording überprüft
- [ ] DSGVO-konform (lokale Datenspeicherung)

---

## 🎉 Timeline

**Woche 1: Vorbereitung**
- Tag 1-2: Icons, Screenshots, Privacy Policy
- Tag 3-4: RevenueCat Dashboard Setup
- Tag 5: App Store Connect Products
- Tag 6-7: Code anpassen, Production Keys

**Woche 2: TestFlight**
- Tag 1: EAS Build erstellen
- Tag 2: TestFlight Internal Testing
- Tag 3-5: Subscription Testing (Sandbox)
- Tag 6-7: Bug Fixes, Feedback einarbeiten

**Woche 3: Review**
- Tag 1: App Store Listing finalisieren
- Tag 2: Submit for Review
- Tag 3-5: Warten auf Review (24-48h meist)
- Tag 6-7: Launch! 🚀

**Woche 4+: Android**
- Nach iOS-Stabilisierung
- Google Play Console Setup
- Play Store Submission

---

## 💡 Pro Tips

1. **TestFlight zuerst:**
   - Lade 5-10 Freunde als Tester ein
   - Sammle Feedback BEVOR du submitest
   - Fix alle Bugs in TestFlight

2. **Subscription Testing:**
   - Sandbox Account ist NICHT dein echter Apple ID
   - Teste Restore Purchases gründlich
   - Verify Trial Messaging (14 Tage)

3. **Review Rejection vermeiden:**
   - Disclaimer zu BAC-Schätzung gut sichtbar
   - KEINE "you can drive" Aussagen
   - Age Rating 17+ wegen Alcohol
   - Demo Account bereitstellen

4. **Monitoring:**
   - Erste 48h nach Launch: Täglich Crash Reports checken
   - RevenueCat Dashboard: Trial → Paid Conversion
   - App Store Reviews: Schnell reagieren

---

**Viel Erfolg beim Launch! 🚀**

Falls du Fragen hast während der Umsetzung, melde dich jederzeit.
