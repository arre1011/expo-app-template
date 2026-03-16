# Subscription Setup Guide
**RevenueCat + App Store Connect Integration**

Komplette Anleitung zum Erstellen von Subscriptions mit RevenueCat und App Store Connect.

---

## Voraussetzungen

- Apple Developer Account ($99/Jahr)
- RevenueCat Account (kostenlos)
- App Bundle ID: `com.drinktracking.app`

---

## Teil 1: App Store Connect Setup

### 1.1 Subscription Group erstellen

1. **App Store Connect** öffnen
2. **Apps** → Deine App → **Subscriptions**
3. **"Create Subscription Group"** klicken
4. **Group Reference Name**: `premium`
5. **Save**

### 1.2 Subscription Group Localization hinzufügen

⚠️ **KRITISCH: Ohne Group Localization bleiben alle Subscriptions auf "Missing Metadata"!**

1. Auf der **Subscription Group "premium"** Seite
2. **Localization** → **"Add Localization"**
3. **Sprache**: German (oder English U.S.)
4. **Subscription Group Display Name**: `Premium`
5. **Save**

### 1.3 Subscriptions erstellen

Für jede Subscription (monthly, yearly):

1. **"Create Subscription"** klicken
2. **Felder ausfüllen**:
   - **Reference Name**: `monthly` (oder `yearly`)
   - **Product ID**: `monthly` (oder `yearly`)
   - **Subscription Duration**: `1 month` (oder `1 year`)
3. **Save**

### 1.4 Localization für jede Subscription

1. Auf der Subscription-Seite (z.B. "monthly")
2. **Localization** → **"Add Localization"**
3. **Sprache**: German
4. **Ausfüllen**:
   - **Display Name**: `Premium Monatlich`
   - **Description**: `Vollzugriff auf alle Premium-Funktionen`
5. **Save**

### 1.5 Pricing hinzufügen

1. Auf der Subscription-Seite (z.B. "monthly")
2. **Subscription Prices** → **"Add Subscription Price"**
3. **Ausfüllen**:
   - **Territory**: Germany (oder All Countries)
   - **Price**: €3.99 (monthly) oder €34.99 (yearly)
   - **Optional: Free Trial**: 14 days
4. **Save**

### 1.6 Screenshot für Review hinzufügen

⚠️ **KRITISCH: Ohne Screenshot bleibt Status auf "Missing Metadata"!**

1. Auf der Subscription-Seite
2. **Review Information** → **"Screenshot"**
3. **Screenshot hochladen** (zeigt die Paywall in deiner App)
4. **Save**

### 1.7 Status prüfen

Nach dem Ausfüllen aller Felder:
- **Localization Status**: "Prepare for Submission" ✅ (das ist OK!)
- **Subscription Status**: "Prepare for Submission" ✅

Falls "Missing Metadata":
- Prüfe ob Subscription Group Localization vorhanden ist
- Prüfe ob Screenshot hochgeladen wurde
- Prüfe ob Pricing für mindestens 1 Territory gesetzt ist

---

## Teil 2: RevenueCat Setup

### 2.1 Projekt erstellen

1. **RevenueCat Dashboard** öffnen: https://app.revenuecat.com
2. **Create New Project** → Name: `Drink Tracker`
3. **Platform**: iOS

### 2.2 App konfigurieren

1. **App Settings** → **Apple App Store**
2. **Bundle ID**: `com.drinktracking.app`
3. **Shared Secret**: Von App Store Connect kopieren
   - App Store Connect → Apps → App Information → App-Specific Shared Secret
4. **Save**

### 2.3 Products importieren

1. **Products** → **Import from App Store Connect**
2. Warte bis Import abgeschlossen ist
3. Prüfe ob Products sichtbar sind:
   - `monthly`
   - `yearly`

### 2.4 Entitlement erstellen

1. **Entitlements** → **"+ New"**
2. **Identifier**: `Drink monitoring Pro`
3. **Save**

### 2.5 Offering erstellen

1. **Offerings** → **"+ New"**
2. **Identifier**: `default`
3. **Save**

### 2.6 Packages hinzufügen

Für jede Subscription ein Package:

1. **In Offering "default"** → **"+ Add Package"**
2. **Identifier**: `monthly` (oder `yearly`)
3. **Product**: `monthly` (aus Dropdown wählen)
4. **Entitlement**: `Drink monitoring Pro`
5. **Save**

Wiederholen für alle Subscriptions.

---

## Teil 3: Integration in App

### 3.1 API Keys holen

1. **RevenueCat Dashboard** → **Project Settings** → **API Keys**
2. **Public Apple SDK Key** kopieren (beginnt mit `appl_...`)

### 3.2 EAS Secret erstellen

```bash
eas secret:create --scope project --name REVENUECAT_API_KEY --value "appl_DEIN_KEY_HIER"
```

### 3.3 app.json konfigurieren

```json
{
  "expo": {
    "extra": {
      "REVENUECAT_API_KEY": "${REVENUECAT_API_KEY}"
    }
  }
}
```

### 3.4 RevenueCat Service verwenden

Der Service ist bereits implementiert in:
`src/services/revenueCatService.ts`

**Key-Auswahl erfolgt automatisch:**
- Expo Go → Test Key
- EAS Build → Production Key (aus EAS Secret)
- Local USB Build → Test Key (Fallback)

---

## Teil 4: Testing

### 4.1 TestFlight Build erstellen

```bash
# Build erstellen
eas build --platform ios --profile preview

# Zu TestFlight hochladen
eas submit --platform ios --latest
```

### 4.2 In TestFlight testen

1. **TestFlight App** öffnen
2. App installieren
3. **Mit Sandbox Account testen**:
   - Settings → App Store → Sandbox Account
   - Dummy Apple ID erstellen für Testing

---

## Troubleshooting

### "Missing Metadata" Status

**Checkliste:**
1. ✅ Subscription Group Localization vorhanden?
2. ✅ Jede Subscription hat Localization?
3. ✅ Pricing für mindestens 1 Territory gesetzt?
4. ✅ **Screenshot für Review hochgeladen?**
5. ✅ Subscription Duration ausgewählt?

### RevenueCat Fehler: "No products found"

**Lösung:**
1. Warte 24h nach App Store Connect Setup
2. Prüfe ob Products in RevenueCat importiert wurden
3. Prüfe ob Packages mit Products verlinkt sind
4. Prüfe ob Entitlement gesetzt ist

### "Products could not be fetched from App Store Connect"

**Ursache:** Subscriptions haben "Missing Metadata" Status

**Lösung:** Siehe "Missing Metadata" Checkliste oben

---

## Product IDs Übersicht

| Product ID | Display Name | Preis | Duration |
|------------|-------------|-------|----------|
| `monthly` | Premium Monatlich | €3.99 | 1 month |
| `yearly` | Premium Jährlich | €34.99 | 1 year |
| `lifetime` | Premium Lebenslang | €79.99 | Non-renewing |

**Entitlement ID:** `Drink monitoring Pro`
**Offering ID:** `default`

---

## Wichtige Links

- **RevenueCat Dashboard**: https://app.revenuecat.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **RevenueCat Docs**: https://docs.revenuecat.com
- **Apple Subscriptions Guide**: https://developer.apple.com/app-store/subscriptions/

---

*Letzte Aktualisierung: 06.01.2026*
