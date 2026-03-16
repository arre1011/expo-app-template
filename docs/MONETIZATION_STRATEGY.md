# Monetarisierungs-Strategie

Empfohlene Paywall-Strategie für die Drink Monitoring App.

## 💰 Pricing-Modell

### Empfohlene Preise

```
┌─────────────────────────────────────────────────┐
│  MONTHLY SUBSCRIPTION                           │
│  ────────────────────────────────────────────  │
│  14 Tage kostenlos testen                      │
│  Dann €3,99/Monat                              │
│  Jederzeit kündbar                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ANNUAL SUBSCRIPTION  ⭐ MOST POPULAR           │
│  ────────────────────────────────────────────  │
│  14 Tage kostenlos testen                      │
│  Dann €34,99/Jahr                              │
│  Spare 26% (€13/Jahr)                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  LIFETIME ACCESS  💎 BEST VALUE                 │
│  ────────────────────────────────────────────  │
│  €79,99 einmalig                               │
│  Lebenslanger Zugriff                          │
│  Nie wieder zahlen                             │
└─────────────────────────────────────────────────┘
```

### Warum diese Preise?

**Monthly €3,99:**
- ✅ Niedriger Einstieg (Kaffee-Preis)
- ✅ Attraktiv für Tester
- ✅ Gute Conversion nach Free Trial

**Annual €34,99 (26% Rabatt):**
- ⭐ Anchoring Effect: wirkt nach Monthly wie Schnäppchen
- ⭐ Höherer Customer Lifetime Value
- ⭐ Geringere Churn-Rate

**Lifetime €79,99:**
- 💎 Premium-Option für Power-User
- 💎 Sofortige Einnahmen
- 💎 Starke Kundenbindung

---

## 🎯 Paywall Timing-Strategie

### Phase 1: Freemium (Kein Block)

```typescript
App Start
  ↓
Onboarding (Profil Setup)
  ↓
✅ KOSTENLOS: Erste 3 Getränke tracken
  ↓
✅ KOSTENLOS: BAC berechnen
  ↓
✅ KOSTENLOS: Heute's Übersicht
```

**Warum?** Nutzer muss erstmal Wert der App verstehen!

### Phase 2: Soft Nudge (Nach 3 Drinks)

```typescript
Nach 3. Getränk
  ↓
┌──────────────────────────────────────┐
│  ✨ Du nutzt die App aktiv!          │
│                                      │
│  Upgrade zu Pro für:                 │
│  • Unbegrenzten Verlauf              │
│  • Erweiterte Statistiken            │
│  • Daten-Export                      │
│                                      │
│  [14 Tage kostenlos testen]          │
│  [Vielleicht später]                 │
└──────────────────────────────────────┘
```

**Warum?** Zeigt Interesse, aber blockiert nicht.

### Phase 3: Soft Limit (Nach 10 Drinks ODER 3 Tagen)

```typescript
Nach 10 Getränken ODER 3 Tagen Nutzung
  ↓
┌──────────────────────────────────────┐
│  🎯 Free-Limit erreicht              │
│                                      │
│  Weiter nutzen mit Einschränkungen:  │
│  • Nur letzte 7 Tage Verlauf         │
│  • Basis-Statistiken                 │
│  • Kein Export                       │
│                                      │
│  ODER                                │
│                                      │
│  [Upgrade zu Pro - 14 Tage gratis]  │
└──────────────────────────────────────┘
```

**Warum?** Nutzer hat Value verstanden, ist investiert.

### Phase 4: Feature-Gates (Immer)

```typescript
Nutzer tippt auf "Export Daten"
  ↓
┌──────────────────────────────────────┐
│  📊 Export ist ein Pro Feature       │
│                                      │
│  Mit Pro kannst du:                  │
│  • Daten als CSV exportieren         │
│  • Statistiken teilen                │
│  • Backup erstellen                  │
│                                      │
│  [14 Tage kostenlos testen]          │
│  [Zurück]                            │
└──────────────────────────────────────┘
```

---

## 🆓 Freemium vs. Pro Features

### ✅ Immer Kostenlos (Kern-App)

| Feature | Beschreibung |
|---------|--------------|
| 🍺 Getränke tracken | Unbegrenzt loggen |
| 📊 BAC berechnen | Live-Berechnung |
| 🏠 Heute-Ansicht | Heutige Daten & BAC |
| ⚠️ Limit-Warnung | EU-Grenze (0.5‰) |
| 📅 Basis-Kalender | Letzte 7 Tage |
| ⏰ Nüchtern-Zeit | Wann wieder 0.0‰ |

**Warum?** Core-Value muss kostenlos sein = Langfristige Retention.

### 🔒 Pro Features (Bezahlt)

| Feature | Beschreibung | Value |
|---------|--------------|-------|
| 📈 Erweiterte Statistiken | Trends, Durchschnitt, Peaks | Insights |
| 📅 Unbegrenzter Verlauf | Alle Daten, kein Limit | Historie |
| 💾 Daten-Export | CSV Export | Backup |
| 🎯 Custom Limits | Eigene BAC-Grenzen | Personalisierung |
| 🔔 Smart Reminders | Hydration, Tracking | Proaktiv |
| ☁️ Cloud Sync* | Geräte-Übergreifend | Multi-Device |

*Coming Soon

**Warum?** Power-User zahlen für Komfort & Analyse.

---

## 🎫 Coupon-Code System

### Verfügbare Codes

```typescript
// Launch Promotion
Code: LAUNCH2025
Rabatt: 30%
Gültig bis: 31.03.2025
Max. Nutzungen: 1,000

// Freunde Werben
Code: FRIEND20
Rabatt: 20%
Gültig bis: Unbegrenzt
Max. Nutzungen: Unbegrenzt
```

### Wo Codes anzeigen?

**Im Marketing:**
- ✉️ Launch-Email: "LAUNCH2025 für 30% Rabatt"
- 📱 Social Media Posts
- 🌐 Website-Banner
- 📧 Newsletter

**In der App:**
- 💡 Paywall: "Hast du einen Gutschein-Code?"
- 🎁 Freunde einladen: "Teile FRIEND20"

### Code-Eingabe UI

```
┌──────────────────────────────────────┐
│  Gutscheincode einlösen?             │
│  ┌────────────────────┬────────────┐ │
│  │ LAUNCH2025         │  Einlösen  │ │
│  └────────────────────┴────────────┘ │
│  ✅ 30% Rabatt aktiviert!            │
│                                      │
│  Annual: €34,99 → €24,49             │
└──────────────────────────────────────┘
```

---

## 📊 Conversion-Optimierung

### A/B Test Ideen

**Test 1: Trial-Länge**
- A: 7 Tage Free Trial
- B: 14 Tage Free Trial ⭐ (Empfohlen)
- C: 30 Tage Free Trial

**Test 2: Default Selection**
- A: Monthly vorausgewählt
- B: Annual vorausgewählt ⭐ (Empfohlen)
- C: Lifetime vorausgewählt

**Test 3: Paywall Timing**
- A: Nach 3 Drinks zeigen
- B: Nach 10 Drinks zeigen ⭐ (Empfohlen)
- C: Nach 3 Tagen zeigen

### Conversion-Trichter

```
100 App Downloads
  ↓ 70% complete Onboarding
70 Active Users
  ↓ 40% reach 3 drinks
28 See Soft Nudge
  ↓ 10% convert
~3 Paying Customers

Ziel: 3-5% Conversion Rate
```

---

## 🛠️ Technische Implementation

### 1. Tracking im Code

```typescript
// Track paywall views
analytics.track('paywall_viewed', {
  trigger: 'drink_limit', // or 'pro_feature', 'manual'
  drinksCount: 10,
  daysUsed: 3,
});

// Track conversions
analytics.track('subscription_started', {
  plan: 'annual',
  price: 34.99,
  hasCoupon: true,
  couponCode: 'LAUNCH2025',
  discount: 30,
});
```

### 2. Feature Gates

```typescript
import { useProAccess } from '@/ui/components';

function ExportButton() {
  const { requireProAccess } = useProAccess();

  const handleExport = () => {
    if (!requireProAccess('Data Export')) {
      // Paywall shown automatically
      return;
    }

    // User has Pro, proceed
    exportData();
  };
}
```

### 3. Free Tier Limits

```typescript
import { shouldShowHardPaywall } from '@/domain/constants/subscriptionConfig';

const canAddDrink = !shouldShowHardPaywall(
  totalDrinks,
  daysUsed,
  isProUser
);

if (!canAddDrink && !isProUser) {
  router.push('/(modals)/paywall');
}
```

---

## 📈 Metriken zum Tracken

### Wichtige KPIs

| Metrik | Zielwert | Beschreibung |
|--------|----------|--------------|
| **Trial Start Rate** | 10-15% | % der Nutzer die Trial starten |
| **Trial → Paid** | 20-30% | % der Trials die konvertieren |
| **Churn Rate** | <5%/Monat | % der Kündigungen |
| **LTV** | >€30 | Customer Lifetime Value |
| **Payback Period** | <3 Monate | Wann ist User profitabel |

### Analytics Events

```typescript
// Paywall Events
'paywall_viewed'
'paywall_dismissed'
'trial_started'
'subscription_purchased'
'coupon_applied'

// Feature Events
'pro_feature_attempted' // User tried Pro feature
'export_blocked' // Free user tried export
'stats_blocked' // Free user tried advanced stats

// Engagement
'drinks_logged' // Track usage
'app_opened_days' // Daily actives
```

---

## 🎨 UI/UX Best Practices

### Paywall Design Principles

1. **Value First**
   - Zeige Benefits vor Preisen
   - Nutze Emojis und Icons
   - Konkrete Features, keine Marketing-Sprache

2. **Social Proof**
   - "Join 10,000+ users tracking mindfully"
   - Testimonials (später)
   - Ratings (wenn gut)

3. **Clear CTA**
   - "Start 14-Day Free Trial"
   - NICHT: "Subscribe" oder "Pay"
   - Groß, farbig, prominent

4. **Trust Signals**
   - "Cancel anytime"
   - "No commitment"
   - "Money-back guarantee" (optional)

5. **Urgency (optional)**
   - "Limited offer: 30% off"
   - "Promo ends March 31"
   - Nicht übertreiben!

### Farben & Psychologie

```typescript
Primary Button (Trial): Grün/Blau
  → Trust, Action, Positive

Annual Badge: Orange/Gold
  → "Most Popular", Attention

Lifetime Badge: Purple/Premium
  → "Best Value", Exclusivity

Discount: Red
  → Urgency, Savings
```

---

## 🚀 Launch-Plan

### Phase 1: Soft Launch (Woche 1-2)

- ✅ Free Trial: 14 Tage
- ✅ Nur Annual & Monthly anbieten
- ✅ Keine Coupons
- 📊 Daten sammeln, Feedback hören

### Phase 2: Optimierung (Woche 3-4)

- 🔄 A/B Tests laufen lassen
- 💰 Lifetime Option hinzufügen
- 🎫 Launch-Coupon aktivieren (30%)
- 📈 Conversion optimieren

### Phase 3: Scale (Monat 2+)

- 📣 Marketing push
- 👥 Influencer Codes
- 🎁 Referral Program
- 💎 Lifetime als "Black Friday" Deal

---

## 💡 Pro Tips

### Do's ✅

- Wert zeigen BEVOR Paywall
- Trial lang genug (14 Tage)
- Einfache Kündigung
- Transparente Preise
- Features sichtbar machen

### Don'ts ❌

- Zu früh blockieren
- Aggressive Tactics
- Dark Patterns
- Versteckte Kosten
- Komplizierte Pläne

---

## 📝 Zusammenfassung

**Strategie:**
1. 🆓 Freemium Core (Getränke tracken, BAC, 7 Tage)
2. 💰 Pro für Power-User (Stats, Export, Unlimited)
3. 🎁 14-Tage Free Trial (niedrige Hemmschwelle)
4. 🎫 Coupon-Codes (Marketing-Kampagnen)
5. ⏰ Progressive Paywall (erst nach Wert-Verständnis)

**Erwartete Conversion:**
- 100 Downloads
- → 70 Active Users (70%)
- → 10 Trial Starts (14%)
- → 3 Paid Users (30% von Trials)
- = **3% Overall Conversion** ✅

**Geschätzter MRR bei 1,000 Aktiven:**
- 30 Paid Users
- 20 Monthly (€3.99) = €80
- 10 Annual (€34.99/12) = €29
- = **~€110 MRR** 📈

**Mit 10,000 Aktiven: ~€1,100 MRR** 🚀

---

Implementiert in:
- `src/domain/constants/subscriptionConfig.ts` - Config
- `app/(modals)/paywall-enhanced.tsx` - Enhanced Paywall
- `app/(modals)/paywall.tsx` - Simple Paywall (Fallback)
