# Onboarding & Paywall Placement Research

> Recherche zur optimalen Reihenfolge von Onboarding-Screens und Paywall-Platzierung

## Ausgangsfrage

**Aktueller Flow:**
1. App-Beschreibung (mehrere Screens)
2. Setup (Gewicht, Geschlecht, etc.)
3. Paywall

**Alternative:**
1. App-Beschreibung
2. Paywall
3. Setup

**Hypothese:** Setup macht keinen Spaß → User sind danach "erschöpft" → sagen eher Nein zur Paywall

---

## Wichtigste Erkenntnisse aus der Forschung

### Timing ist entscheidend

- **82% der Trial-Starts passieren am ersten Tag** (Installation Day)
- **85% der User treffen ihre Kaufentscheidung in den ersten 5 Minuten**
- **90% aller Conversions** kommen aus zwei Stellen: Onboarding-Flow und Home-Screen
- Wenn User die Paywall nicht in der ersten Session sehen, ist das optimale Conversion-Window verpasst

### Conversion-Raten nach Paywall-Platzierung

| Reihenfolge | Trial Opt-In Rate |
|-------------|-------------------|
| Welcome → Onboarding → Home → Paywall | **2%** |
| Welcome → Paywall → Onboarding → Home | **8%** |
| Welcome → 3-Screen Carousel → Paywall → Onboarding | **15%** |

**Quelle:** A/B-Test mit Pre-Paywall Content

### Upfront Paywall Statistik

Eine Analyse von **1.240 Subscription-Apps** ergab:
- Apps mit **Upfront Paywall**: ~12% Trial-to-Paid Conversion
- Apps mit **Post-Content Paywall**: ~2% Trial-to-Paid Conversion
- **5.5x Unterschied**

---

## Fallstudien

### Rootd (Anxiety Relief App)
- Paywall an den **Anfang** des Onboardings verschoben (aber dismissible)
- **Ergebnis: 5x Revenue-Steigerung**

### FitnessAI
- Paywall **vor** das Onboarding verschoben + Video hinzugefügt
- 50% mehr User sahen die Paywall
- **Ergebnis: Install-to-Trial Conversions verdoppelt**

### Meditation App (Gegenbeispiel)
- Paywall upfront verschoben
- **Ergebnis: Conversion sank um 40%**
- Grund: Value Proposition war nicht sofort klar

---

## Psychologische Effekte

### Endowment Effect (Besitztumseffekt)
Wenn User Zeit und Mühe in Personalisierung investieren, entwickeln sie ein Gefühl von Ownership. Sie bewerten das, was sie "besitzen" (ihren personalisierten Plan), höher.

### Sunk Cost / Commitment
- User die bereits Zeit investiert haben, wollen diese Investition nicht "verlieren"
- Personalisierung vor der Paywall erhöht das Commitment
- Die Paywall fühlt sich dann wie der "letzte Schritt" an, nicht wie eine Barriere

### Reciprocity Effect (Reziprozität)
- Erst Wert geben, dann etwas verlangen
- User fühlen sich verpflichtet, etwas zurückzugeben
- Beispiel: Duolingo lässt User eine komplette Lektion machen vor der Paywall

### Loss Aversion (Verlustaversion)
- Menschen bewerten potenzielle Verluste höher als Gewinne
- "Verpasse nicht deine personalisierten Insights" funktioniert besser als "Erhalte Insights"

---

## Zwei Hauptstrategien

### Option A: Paywall First (Dismissible)

```
1. Value Screens (2-3 Screens) → "Heiß machen"
2. Paywall (mit "Später"-Button)
3. Setup (Gewicht, Geschlecht)
```

**Vorteile:**
- Maximale Paywall-Sichtbarkeit
- User die Setup machen, sind bereits qualifiziert
- Einfacher zu implementieren

**Nachteile:**
- Paywall ohne Personalisierung
- Weniger "Investment" vom User

**Beste für:** Apps mit sehr klarer, sofort verständlicher Value Proposition

---

### Option B: Personalisierung → Personalisierte Paywall

```
1. Value Screens (2-3 Screens) → "Heiß machen"
2. Personalisierung (als Investment framen)
   - "Lass uns deinen persönlichen Plan erstellen"
   - Progress-Bar zeigen
   - Fragen positiv formulieren
3. Personalisierte Paywall
   - "Basierend auf deinen Angaben..."
   - "Dein persönlicher Plan ist bereit"
```

**Vorteile:**
- Höheres Commitment durch Investment
- Paywall kann personalisiert werden
- Endowment Effect greift

**Nachteile:**
- Risiko: User brechen beim Setup ab
- Komplexer zu implementieren

**Beste für:** Apps wo Personalisierung den Wert steigert (wie BAC-Berechnung)

---

## Empfehlung für Drink-Tracking App

### Warum Option B besser passt:

1. **BAC-Berechnung BRAUCHT Personalisierung** - Gewicht und Geschlecht sind keine "nice to have", sondern essentiell für die Kernfunktion

2. **Personalisierung IST der Wert** - "Dein persönlicher BAC-Rechner" ist überzeugender als ein generischer Tracker

3. **Reframing des Setups:**
   - ❌ "Gib dein Gewicht ein" (= Arbeit)
   - ✅ "Für genaue Berechnung brauchen wir dein Gewicht" (= Investment in Genauigkeit)

### Empfohlener Flow:

```
Screen 1: Welcome / Problem Statement
   "Behalte den Überblick über deinen Alkoholkonsum"

Screen 2: Value Proposition
   "Erhalte genaue BAC-Schätzungen in Echtzeit"

Screen 3: Social Proof / Benefits
   "Mindful trinken mit wissenschaftlicher Berechnung"

Screen 4-6: Personalisierung
   "Für genaue Berechnungen..."
   - Geschlecht (mit Erklärung: beeinflusst Körperwasser-Anteil)
   - Gewicht (mit Einheiten-Auswahl)
   - Optional: Tägliches Limit setzen
   [Progress Bar zeigen]

Screen 7: Personalisierte Paywall
   "Dein persönlicher BAC-Tracker ist bereit"
   - Zeigt eingegebene Werte
   - "Starte jetzt mit 7 Tagen kostenlos"
   - [Später] Button prominent sichtbar
```

---

## Best Practices für die Paywall

### Design
- **2-3 Plan-Optionen** (nicht 6-7)
- **Jährlich als Default** mit klarer Ersparnis ("Spare 40%")
- **Klares Trial-Framing:** "7 Tage kostenlos, dann X€/Monat. Jederzeit kündbar."
- **Respektvoller Exit:** "Später" oder "X" Button gut sichtbar

### Copy
- Messaging aus dem Onboarding wiederverwenden
- Benefit-driven CTAs: "Meinen Plan starten" statt "Abonnieren"
- Social Proof wenn vorhanden (Reviews, Bewertungen)

### Psychologie
- **Decoy Effect:** 3 Pläne, mittlerer als "Köder" für den teuersten
- **Progress zeigen:** User Journey hat bereits begonnen
- **Personalisierung nutzen:** "Basierend auf deinem Profil..."

---

## Metriken zum Tracken

| Metrik | Ziel | Beschreibung |
|--------|------|--------------|
| Install-to-Paywall View | ≥85% | Anteil der User die Paywall sehen |
| Paywall-to-Trial | ≥10-15% | Trial-Starts von Paywall-Views |
| Trial-to-Paid | ≥12% | Bezahlende nach Trial-Ende |
| Day 1 Retention | ≥40% | User die am nächsten Tag zurückkommen |

---

## Quellen

- [RevenueCat: Paywall Placement Optimization](https://www.revenuecat.com/blog/growth/paywall-placement/)
- [RevenueCat: Hard vs Soft Paywall](https://www.revenuecat.com/blog/growth/hard-paywall-vs-soft-paywall/)
- [AppAgent: Mobile App Onboarding Strategies](https://appagent.com/blog/mobile-app-onboarding-5-paywall-optimization-strategies/)
- [The Paywall Timing Paradox (DEV)](https://dev.to/paywallpro/the-paywall-timing-paradox-why-showing-your-price-upfront-can-5x-your-conversions-4alc)
- [Designing Onboarding Flows That Convert (DEV)](https://dev.to/paywallpro/designing-onboarding-flows-that-convert-how-to-build-trust-before-the-paywall-knp)
- [Apphud: High-Converting Paywalls](https://apphud.com/blog/design-high-converting-subscription-app-paywalls)
- [Apphud: Best-Performing Onboarding Examples](https://apphud.com/blog/best-performing-mobile-app-onboarding-examples)
- [Airbridge: Hard vs Soft Paywalls](https://www.airbridge.io/blog/hard-vs-soft-paywalls)
- [Growth Gems: Should You Have a Hard Paywall?](https://growthgems.substack.com/p/should-you-have-a-hard-paywall)

---

*Recherche durchgeführt: Januar 2026*
