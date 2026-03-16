# In-App-Purchase & Subscription Setup

## Übersicht

Diese Dokumentation erklärt das Zusammenspiel von RevenueCat, Apple's In-App-Purchase System und unserem Build-Prozess für Subscriptions.

---

## Komponenten & deren Rolle

### RevenueCat
Cross-Platform Subscription Management Service. Vereinheitlicht Apple StoreKit und Google Play Billing, validiert Receipts server-side und synchronisiert Subscription-Status.

**Warum RevenueCat?**
- ✅ Ein SDK für iOS & Android
- ✅ Automatische Receipt Validation
- ✅ Webhook-Integration
- ✅ Analytics & Charts
- ✅ Customer Support Tools

### Apple StoreKit (Sandbox vs. Production)
Apple's Framework für In-App-Purchases. Hat zwei komplett getrennte Umgebungen:

**Sandbox (Testing):**
- Für Development & TestFlight Builds
- Fake Purchases, kein echtes Geld
- Test-Accounts unter appstoreconnect.apple.com
- Receipts werden von Apple Sandbox Server validiert

**Production:**
- Für App Store Builds
- Echte Purchases mit echtem Geld
- Echte Apple IDs
- Receipts werden von Apple Production Server validiert

### App Store Connect
Hier werden In-App-Purchases (Subscriptions) konfiguriert. Die Produkte (z.B. "Premium Monthly") sind **identisch** in Sandbox und Production - nur die Umgebung ist anders.

---

## Automatische API Key Auswahl (Best Practice)

**Problem:** Wir brauchen verschiedene Keys für verschiedene Umgebungen, aber wollen den Code nicht ständig ändern.

**Lösung:** Automatische Key-Auswahl basierend auf Build-Type!

### Wie es funktioniert

```typescript
// src/services/revenueCatService.ts
const getApiKey = (): string => {
  // 1. Expo Go Detection
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  const isExpoGo = !bundleId || bundleId === 'host.exp.Exponent';

  // 2. Environment Variable Check
  const envApiKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY;

  if (isExpoGo) {
    return 'test_...';  // Test Key für Expo Go
  }

  if (envApiKey) {
    return envApiKey;    // Production Key aus EAS Secret
  }

  return 'test_...';     // Fallback
};
```

### Environment Matrix

| Build Type | Bundle ID | API Key Source | StoreKit |
|------------|-----------|----------------|----------|
| **Expo Go (Simulator)** | `host.exp.Exponent` | Hardcoded `test_...` | Browser Mode |
| **Local USB Build** | `com.drinktracking.app` | Fallback `test_...` | Sandbox (optional) |
| **TestFlight (EAS)** | `com.drinktracking.app` | EAS Secret `appl_...` | Sandbox |
| **App Store (EAS)** | `com.drinktracking.app` | EAS Secret `appl_...` | Production |

### Setup (Einmalig)

1. **RevenueCat Production Key holen:**
   - RevenueCat Dashboard → Project Settings → API Keys
   - Kopiere "Public Apple SDK Key" (`appl_...`)

2. **Als EAS Secret speichern:**
   ```bash
   eas secret:create --scope project --name REVENUECAT_API_KEY --value "appl_DEIN_KEY_HIER"
   ```

3. **In app.json referenzieren:**
   ```json
   {
     "expo": {
       "extra": {
         "REVENUECAT_API_KEY": "${REVENUECAT_API_KEY}"
       }
     }
   }
   ```

**Fertig!** Der Code wählt nun automatisch den richtigen Key:
- ✅ Expo Go → Test Key (automatisch)
- ✅ EAS Builds → Production Key (automatisch)
- ✅ Kein Code-Change nötig!

### Lokales Testing mit echtem Key (Optional)

Wenn du lokal Sandbox Purchases testen willst:

```typescript
// src/services/revenueCatService.ts (Zeile 42)
// Fallback: Hardcode deinen Production Key für lokales Testing
return 'appl_DEIN_PRODUCTION_KEY';  // Statt test_...
```

**Wichtig:** Diesen Key NICHT committen! Nutze `.env` Files oder ähnliches.

---

## RevenueCat Keys (API Keys)

### Test Key (`test_...`)
- **Zweck:** Nur für Expo Go Entwicklung
- **Funktion:** RevenueCat läuft im "Browser Mode" ohne echte Purchases
- **Verwendung:** Niemals in echten Builds verwenden!

### Public SDK Key (`appl_...`)
- **Zweck:** Production Builds (App Store)
- **Funktion:** Kommuniziert mit RevenueCat Production Environment
- **Verwendet:** Apple Production StoreKit

### Public SDK Key für Sandbox Testing
RevenueCat erkennt **automatisch** ob ein Build im Sandbox-Modus läuft:
- TestFlight Build → Nutzt Apple Sandbox automatisch
- App Store Build → Nutzt Apple Production automatisch

**Der gleiche `appl_...` Key funktioniert für beides!**

---

## Environment Setup & Best Practices

### Development (Local, Simulator)

**Bundle ID:** `com.drinktracking.app.dev`

**RevenueCat Setup:**
```typescript
// Option 1: Test-Modus für schnelle Iteration
await Purchases.configure({
  apiKey: 'test_...',  // RevenueCat Test Key
});
// Kein echtes StoreKit, nur UI-Testing

// Option 2: Echtes Sandbox Testing
await Purchases.configure({
  apiKey: process.env.REVENUECAT_API_KEY,  // Echter appl_ Key
});
// Nutzt Apple Sandbox mit Test-Account
```

**Empfehlung:** Test Key für UI-Development, echter Key nur wenn StoreKit-Flows getestet werden müssen.

**Apple Setup:**
- Sandbox Test-Account erstellen (appstoreconnect.apple.com → Users and Access → Sandbox Testers)
- Im Simulator: Einstellungen → App Store → Sandbox Account einloggen

### Preview (TestFlight)

**Bundle ID:** `com.drinktracking.app`

**RevenueCat Setup:**
```typescript
await Purchases.configure({
  apiKey: process.env.REVENUECAT_API_KEY,  // appl_... Key aus EAS Secret
});
```

**Apple Environment:** **SANDBOX**
- TestFlight Builds laufen **immer** im Sandbox-Modus
- Nutze Sandbox Test-Accounts zum Testen
- Kein echtes Geld wird abgebucht

**Wichtig:**
- EAS Secret mit echtem Key setzen (siehe unten)
- Subscription Products in App Store Connect konfigurieren
- Sandbox Tester erstellen

### Production (App Store)

**Bundle ID:** `com.drinktracking.app`

**RevenueCat Setup:**
```typescript
await Purchases.configure({
  apiKey: process.env.REVENUECAT_API_KEY,  // Selber appl_... Key!
});
```

**Apple Environment:** **PRODUCTION**
- App Store Builds laufen automatisch in Production
- Echte Apple IDs
- Echtes Geld wird abgebucht

---

## Setup-Prozess (Step-by-Step)

### 1. RevenueCat Projekt erstellen

1. Gehe zu [RevenueCat Dashboard](https://app.revenuecat.com)
2. Erstelle neues Projekt
3. Erstelle App für iOS
4. Bundle ID: `com.drinktracking.app`
5. Kopiere **Public Apple SDK Key** (`appl_...`)

### 2. Apple In-App-Purchases konfigurieren

1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. Wähle deine App
3. Features → In-App-Purchases → (+)
4. Erstelle Subscription Group (z.B. "Premium")
5. Erstelle Subscription (z.B. "premium_monthly")
   - Product ID: `premium_monthly` (muss in RevenueCat & Code übereinstimmen!)
   - Preis: z.B. 4,99€/Monat
6. Submit for Review (später, wenn App live geht)

### 3. RevenueCat mit Apple verbinden

1. RevenueCat Dashboard → Project Settings → Apple App Store
2. **Shared Secret** hinzufügen:
   - App Store Connect → Apps → App-Specific Shared Secret generieren
   - In RevenueCat einfügen
3. **In-App-Purchase Key** hinzufügen (empfohlen):
   - App Store Connect → Users and Access → Keys → In-App-Purchase
   - .p8 Key generieren und herunterladen
   - In RevenueCat hochladen (bessere Performance, keine Shared Secret nötig)

### 4. RevenueCat Products konfigurieren

1. RevenueCat Dashboard → Products → (+) New
2. Product ID: `premium_monthly` (exakt wie in App Store Connect!)
3. Type: Subscription
4. Store: Apple App Store
5. Erstelle Entitlement (z.B. "pro")
   - Entitlement ist das, was du im Code checkst
   - Ein Entitlement kann mehrere Products haben (monatlich, jährlich)

### 5. EAS Secret für API Key erstellen

```bash
# Production Key als Secret speichern
eas secret:create --scope project --name REVENUECAT_API_KEY --value "appl_YOUR_KEY_HERE"

# Prüfen
eas secret:list
```

**Wichtig:** Dieser Key bleibt dauerhaft gespeichert und wird bei jedem Build automatisch verwendet.

### 6. Code anpassen

```typescript
// src/services/subscriptionStore.ts
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

// Key wird aus Environment Variable gelesen
const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.REVENUECAT_API_KEY || 'test_...';

export const initializeRevenueCat = async () => {
  await Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
  });

  // Debug Info (nur in Development)
  if (__DEV__) {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('RevenueCat Environment:', customerInfo.requestDate);
    console.log('Using API Key:', REVENUECAT_API_KEY.substring(0, 10) + '...');
  }
};
```

### 7. app.json erweitern

```json
{
  "expo": {
    "extra": {
      "REVENUECAT_API_KEY": "${REVENUECAT_API_KEY}"
    }
  }
}
```

EAS ersetzt `${REVENUECAT_API_KEY}` automatisch mit dem Secret-Wert.

---

## Testing-Strategie

### Phase 1: UI Development (Simulator)
**Goal:** UI/UX testen ohne echte Purchases

```typescript
// Test Key verwenden
apiKey: 'test_...'
```

**Vorteil:** Schnell, keine Apple Sandbox nötig
**Nachteil:** Keine echten Purchase-Flows

### Phase 2: Sandbox Testing (TestFlight)
**Goal:** Kompletten Purchase-Flow mit Sandbox testen

```bash
# Build mit echtem Key
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

**Setup:**
1. Sandbox Test-Account erstellen (App Store Connect)
2. TestFlight Build installieren
3. Im iPhone ausloggen aus App Store (Einstellungen → App Store)
4. App öffnen, Purchase starten
5. Sandbox Account eingeben wenn gefragt
6. Purchase testen (kein echtes Geld!)

**Was testen:**
- ✅ Purchase-Flow startet
- ✅ StoreKit Sheet erscheint
- ✅ "Sandbox" Badge sichtbar
- ✅ Purchase succeeds
- ✅ RevenueCat erkennt Active Subscription
- ✅ App entsperrt Premium Features

### Phase 3: Production Testing (App Store)
**Goal:** Finaler Test in Production vor öffentlichem Launch

**Setup:**
1. App Store Build mit `production` profile
2. Als Internal Tester über TestFlight installieren
3. **Mit echter Apple ID** testen (nicht Sandbox!)
4. Echten Purchase machen (wird wirklich abgebucht!)
5. Sofort über App Store Connect refunden

**Wichtig:** Nur minimal testen, da echtes Geld involviert ist!

---

## Sandbox Test-Accounts verwalten

### Sandbox Tester erstellen

1. App Store Connect → Users and Access
2. Sandbox Testers → (+)
3. Email: `test1@yourdomain.com` (muss gültig sein für Verification)
4. Passwort: Sicheres Passwort
5. Region: DE (oder dein Land)

**Tipp:** Erstelle mehrere Tester für verschiedene Szenarien:
- `test-new@...` - Neue Subscriptions testen
- `test-renewal@...` - Renewal testen
- `test-cancel@...` - Cancellation testen

### Sandbox Account im iPhone nutzen

**Wichtig:** **NICHT** unter Einstellungen → App Store anmelden!

**Richtiger Weg:**
1. Ausloggen aus App Store (falls eingeloggt)
2. App öffnen
3. Purchase starten
4. Wenn StoreKit Sheet erscheint → Sandbox Account eingeben
5. "Use Existing Apple ID" falls vorher schon benutzt

**Sandbox Subscriptions zurücksetzen:**

App Store Connect → Sandbox Testers → Tester auswählen → "Clear Purchase History"

---

## Purchase-Flow Diagramm

```
┌─────────────────────────────────────────────────────────┐
│ User startet Purchase                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ App: Purchases.purchasePackage()                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ StoreKit: Zeigt Purchase Dialog                         │
│ - Sandbox: "Sandbox" Badge sichtbar                     │
│ - Production: Normaler Dialog                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ User bestätigt Purchase (Face ID / Passwort)            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Apple: Erstellt Receipt                                 │
│ - Sandbox → Sandbox Receipt                             │
│ - Production → Production Receipt                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ RevenueCat: Validiert Receipt                           │
│ - Sendet Receipt an Apple Server                        │
│ - Apple bestätigt Validität                             │
│ - RevenueCat speichert Subscription Status              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ App: Empfängt CustomerInfo                              │
│ - customerInfo.entitlements.active["pro"] exists        │
│ - App schaltet Premium Features frei                    │
└─────────────────────────────────────────────────────────┘
```

---

## Häufige Probleme

### "This is a test subscription" in TestFlight
**Problem:** Test Key wird in TestFlight Build verwendet
**Lösung:** EAS Secret mit echtem `appl_...` Key setzen

### "Cannot connect to iTunes Store" in Sandbox
**Problem:** Sandbox Tester nicht korrekt eingeloggt
**Lösung:**
1. Komplett aus App Store ausloggen
2. App neu starten
3. Purchase starten
4. Sandbox Account eingeben wenn gefragt

### Purchase succeeded aber App zeigt kein Premium
**Problem:** Entitlement-Check im Code stimmt nicht mit RevenueCat überein
**Lösung:**
```typescript
const customerInfo = await Purchases.getCustomerInfo();
console.log('Active Entitlements:', Object.keys(customerInfo.entitlements.active));
// Prüfen ob der richtige Entitlement-Name verwendet wird
```

### Subscription erscheint nicht in StoreKit Sheet
**Problem:** Product ID stimmt nicht überein oder nicht in RevenueCat konfiguriert
**Lösung:**
1. App Store Connect: Product ID prüfen (z.B. `premium_monthly`)
2. RevenueCat Dashboard: Exakt gleiche Product ID konfigurieren
3. Code: `await Purchases.getOfferings()` loggen und prüfen

---

## Checkliste vor Production Launch

### RevenueCat
- [ ] Production Key (`appl_...`) generiert
- [ ] Als EAS Secret gespeichert
- [ ] Shared Secret oder In-App-Purchase Key in RevenueCat konfiguriert
- [ ] Products & Entitlements konfiguriert
- [ ] Webhook für Backend (falls benötigt)

### App Store Connect
- [ ] In-App-Purchases erstellt
- [ ] Subscription Group erstellt
- [ ] Pricing für alle Regionen gesetzt
- [ ] Subscription Screenshots hochgeladen (für Review)
- [ ] Bank-Informationen hinterlegt (für Auszahlungen)

### Testing
- [ ] Sandbox Purchase tested in TestFlight
- [ ] Subscription renewal tested
- [ ] Cancellation tested
- [ ] Restore Purchases funktioniert
- [ ] Production Purchase tested (1x mit echtem Geld)

### Code
- [ ] Test Key nicht mehr im Code
- [ ] Environment Variable korrekt gelesen
- [ ] Error Handling für failed purchases
- [ ] Loading States während Purchase
- [ ] Restore Purchases Button vorhanden

---

## Best Practices

### 1. Zwei RevenueCat Projekte (Optional)
Für größere Teams: Separates Projekt für Development vs. Production

**Development Projekt:**
- Nutzt `.dev` Bundle ID
- Test Key für schnelle Iteration

**Production Projekt:**
- Nutzt `.app` Bundle ID
- Production Key

### 2. Subscription Tiers über Entitlements
```typescript
// GUT: Ein Entitlement, mehrere Products
entitlements.active["pro"]  // True für monthly ODER yearly

// SCHLECHT: Product IDs direkt checken
activeSubscriptions.includes("premium_monthly")  // Nur monthly!
```

### 3. Restore Purchases prominent platzieren
Apple Guideline: Restore Button muss leicht findbar sein

```typescript
<TouchableOpacity onPress={async () => {
  await Purchases.restorePurchases();
}}>
  <Text>Restore Purchases</Text>
</TouchableOpacity>
```

### 4. Grace Period nutzen
RevenueCat zeigt Subscription als active auch wenn Payment fehlschlägt (Billing Retry). Gibt User Zeit Payment-Methode zu fixen.

---

## Zusammenfassung

### Development (Local)
- **Key:** Test Key (`test_...`) oder echter Key mit Sandbox
- **Apple:** Sandbox
- **Testing:** UI/UX ohne echte Purchases

### Preview (TestFlight)
- **Key:** Production Key (`appl_...`) via EAS Secret
- **Apple:** Sandbox (automatisch)
- **Testing:** Komplette Purchase-Flows mit Test-Accounts

### Production (App Store)
- **Key:** Production Key (`appl_...`) via EAS Secret
- **Apple:** Production (automatisch)
- **Testing:** Minimales Testing, echtes Geld

**Der selbe `appl_...` Key funktioniert für TestFlight (Sandbox) und App Store (Production)!**
RevenueCat und Apple erkennen automatisch die richtige Umgebung.

---

## FAQ - Häufig gestellte Fragen

### Q: Warum Test Key nur für Expo Go, nicht für USB Builds?
**A:** Der `test_...` Key aktiviert RevenueCat's "Browser Mode" - ein Mock-Mode ohne echte Purchases. Das ist OK für UI-Testing im Expo Go, aber wenn du einen echten Build machst (auch lokal per USB), solltest du den echten `appl_...` Key nutzen, damit du optional Sandbox-Purchases testen kannst.

**USB Build = Echter Build = Echter Key (mit Sandbox)**

### Q: Warum soll ich die Paywall lokal nicht aktiv testen?
**A:** Du **kannst** sie testen! Es gibt nur praktische Gründe:

**Nachteile beim lokalen Testing:**
- 🔄 Nach jedem Hot Reload (Code-Change) müsstest du die Paywall wegklicken
- 📊 Viele Test-Purchases in Apple Sandbox → Unübersichtlich in Analytics
- 🐛 Fehler im Purchase-Flow können Development blockieren

**Empfehlung:**
- **Lokale Development:** Paywall UI mit Mock-Daten testen (schnell iterieren)
- **USB/TestFlight:** Ein paar echte Sandbox-Purchases testen (Flow validieren)
- **Production:** Minimal testen vor Launch

**Tipp:** Du kannst die Paywall lokal "deaktivieren" indem du im Code `isProUser` immer auf `true` setzt während der UI-Development.

### Q: Wird die Paywall nach jedem Reload angezeigt?
**A:** Das hängt von deiner Implementierung ab:

**Aktueller Code:**
- Die Paywall wird basierend auf `drinksCount` und `daysUsed` angezeigt
- Diese Werte werden in der Datenbank gespeichert
- Nach Hot Reload bleiben sie bestehen
- **Aber:** Wenn du die App komplett neu installierst, startet der Counter bei 0

**Best Practice:**
- Während Development: Counter manuell in DB anpassen zum Testen
- Oder: Debug-Flag setzen der Paywall forciert/deaktiviert

### Q: Brauche ich einen `.env` File für verschiedene Environments?
**A:** **Nein, nicht für RevenueCat Keys!** Die automatische Lösung ist besser:

**Aktueller Ansatz (Best Practice):**
```
Expo Go           → Automatisch test_ Key (hardcoded)
EAS Builds        → Automatisch appl_ Key (aus EAS Secret)
Lokale USB Builds → Optional: appl_ Key hardcoden (nicht committen)
```

**Vorteile:**
- ✅ Kein `.env` File nötig
- ✅ Kein manuelles Switching
- ✅ Code bleibt gleich, Key ändert sich automatisch
- ✅ EAS Secret ist sicher (nicht im Code)

**`.env` Files nur für:**
- Backend API URLs (dev vs. prod)
- Feature Flags
- Andere config values

**Nicht für RevenueCat Keys!** EAS Secrets + automatische Detection ist besser.

### Q: Wie teste ich Paywall-Flows ohne nervige Reloads?
**A:** Nutze einen Debug-Mode:

```typescript
// src/services/subscriptionStore.ts (ganz oben)
const DEBUG_MODE = {
  FORCE_PAYWALL: false,    // true = Paywall wird immer angezeigt
  FORCE_PRO: false,        // true = User ist immer Pro
  MOCK_PURCHASES: false,   // true = Purchases werden ge-mockt
};

// Dann in deinem Code:
if (DEBUG_MODE.FORCE_PRO) {
  return true; // User hat Pro
}

if (DEBUG_MODE.FORCE_PAYWALL) {
  // Zeige Paywall
}
```

**Workflow:**
1. UI Development → `FORCE_PRO: true` (keine Paywall nervt)
2. Paywall Design → `FORCE_PAYWALL: true` (immer sichtbar)
3. Flow Testing → Beide `false`, echtes Testing

### Q: Kann ich denselben `appl_...` Key für Sandbox UND Production nutzen?
**A:** **Ja! Das ist der Trick!**

RevenueCat erkennt automatisch ob der Build in Sandbox oder Production läuft:
- TestFlight Build → Nutzt Apple Sandbox
- App Store Build → Nutzt Apple Production

**Ein Key, zwei Umgebungen!** Kein Switching nötig.

### Q: Was passiert wenn ich EAS Secret falsch setze?
**A:** Der Build läuft, aber RevenueCat kann keine Purchases validieren.

**Symptom:**
- Purchase Dialog erscheint
- User kann kaufen
- Aber App erkennt Purchase nicht (kein Pro Access)

**Fix:**
```bash
# Secret löschen
eas secret:delete --name REVENUECAT_API_KEY

# Neu setzen mit richtigem Key
eas secret:create --scope project --name REVENUECAT_API_KEY --value "appl_..."

# Neuen Build erstellen
eas build --platform ios --profile preview
```

### Q: Muss ich für lokale Entwicklung Sandbox Test-Accounts erstellen?
**A:** **Nur wenn du Purchases lokal testen willst.**

**Für UI-Development:** Nein, Test Key reicht
**Für Purchase-Flow Testing:** Ja, erstelle 1-2 Sandbox Testers

**Tipp:** Erst in TestFlight mit Sandbox testen, spart lokale Setup-Zeit.

---

*Letzte Aktualisierung: 04.01.2026*
