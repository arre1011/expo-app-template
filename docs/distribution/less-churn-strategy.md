# Less Churn Strategy — Retention Offers bei Kündigung

## Warum: Die Zahlen sprechen für sich

### Churn Benchmarks (Subscription Apps 2024/2025)

| Metrik | Wert |
|--------|------|
| Durchschnittliche monatliche Churn (Subscription Apps) | ~9% |
| Annual Plan 1-Jahres-Retention (Median) | 44% |
| Monthly Plan 1-Jahres-Retention (Median) | 17% |
| 9% monatliche Churn annualisiert | ~66% jährliche Churn |

> Quelle: RevenueCat State of Subscription Apps 2025, Churnkey State of Retention 2025

### Effekt von Retention Offers

| Strategie | Wirkung |
|-----------|---------|
| **Cancellation Flow gesamt** | **34% Save Rate** (1 von 3 Usern bleibt) |
| Discount-Offer Akzeptanzrate | **53%** wenn angeboten |
| Pause-Option Akzeptanzrate | **19%** wenn angeboten |
| Annual statt Monthly (mit 15-20% Rabatt) | **-12% weniger Churn** |

> Die 34% Save Rate basiert auf Daten von **3 Millionen Cancellation Sessions** (Churnkey 2025).

### Was die großen Apps als Retention Offer machen

- **Headspace:** 50% off wenn User "Too expensive" angibt
- **Strava:** Monthly → Annual Conversion mit 40% weniger pro Monat
- **Audible:** Halber Preis oder Gratis-Credit
- **Blinkist:** 30-50% off oder 3 Monate für 1 Euro (~95% Rabatt als Last Resort)

---

## Was: Personalisierte Retention Offers

### Discount Sweet Spot: 25–50% für 3 Monate

| Rabatt | Einsatz | Risiko |
|--------|---------|--------|
| 15-25% | Leichter Nudge, High-Value User | Niedrig |
| **25-50%** | **Hauptbereich für Retention** | **Ausgewogen** |
| 50-70% | Aggressives Win-Back für verlorene User | Höher |
| 70%+ | Letzter Rettungsversuch | Ankering-Risiko |

### Reason-basierte Offers (personalisiert nach Survey-Antwort)

| Kündigungsgrund | Offer |
|-----------------|-------|
| "Too expensive" | 50% off für 3 Monate |
| "Don't use it enough" | Pause für 1-3 Monate |
| "Missing features" | Feedback-Formular + Roadmap-Hinweis |
| "Need a break" | Pause-Option (1, 2 oder 3 Monate) |

### Warnung: Ankering-Effekt

- User die **ohne** Rabatt starten bleiben **2.6x länger**
- Rabatte können den LTV um bis zu **30% senken**
- Einmal gegebener Rabatt setzt eine neue Preiserwartung

---

## Wie: Umsetzungsplan mit RevenueCat

Da wir bereits **RevenueCat** nutzen, ist der effizienteste Weg:

### Schritt 1: Promotional Offers in den Stores erstellen

**Apple App Store Connect:**
1. Apps → Subscriptions → Subscription Group → Subscription Prices → (+)
2. "Create Promotional Offer"
3. Typ: Pay-as-you-go (z.B. 50% off pro Monat)
4. Dauer: 3 Monate
5. Identifier notieren (z.B. `retention_50off_3mo`)

**Google Play Console:**
1. Monetization → Subscriptions → Base Plan → Offer erstellen
2. Eligibility: "Developer determined"
3. Tags: `rc-customer-center`, `rc-ignore-offer`
4. Pricing Phase: 50% off für 3 Monate

### Schritt 2: RevenueCat Customer Center integrieren

```typescript
import { RevenueCatUI } from 'react-native-purchases-ui';

// Eine Zeile — fertige Cancellation-UI mit Survey + Offers
await RevenueCatUI.presentCustomerCenter();
```

Features out of the box:
- Cancellation Survey (konfigurierbar im Dashboard)
- Automatisches Offer-Matching basierend auf Survey-Antwort
- "Too expensive" → zeigt automatisch das Promotional Offer
- Restore Purchases
- Alles vom Dashboard steuerbar (kein App-Update nötig)

### Schritt 3: RevenueCat Dashboard konfigurieren

1. Monetization Tools → Customer Center → Offers Tab
2. Promotional Offer Identifier zuweisen unter "Cancellation Retention Discount"
3. Survey-Fragen konfigurieren
4. Fertig — Changes wirken sofort ohne App-Update

### Schritt 4: Apple Win-Back Offers (für bereits verlorene User)

Für User die schon gekündigt haben (iOS 18+):
1. App Store Connect → "Create Win-Back Offer"
2. Eligibility: Min. 1 Monat bezahlt, 1-6 Monate inaktiv
3. Wird automatisch auf der "Manage Subscriptions" Seite in iOS angezeigt
4. Apple generiert eine Redemption URL für Email-Kampagnen

---

## Erwartetes Ergebnis

- **~34% der User die kündigen wollen bleiben** (Industriebenchmark)
- **53% Akzeptanzrate** wenn ein Discount angeboten wird
- Minimaler Entwicklungsaufwand durch RevenueCat Customer Center
- Survey-Daten liefern wertvolle Insights für Produktverbesserungen

---

## Quellen

- RevenueCat State of Subscription Apps 2025
- Churnkey State of Retention 2025 (3M+ Cancellation Sessions)
- Apple Developer Documentation: Promotional Offers, Win-Back Offers
- Google Play Developer Documentation: Subscription Offers
- RevenueCat Docs: Customer Center, Promotional Offers Configuration
