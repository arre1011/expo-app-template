# Drink Tracking App

Eine React Native Expo App zur Nachverfolgung des Alkoholkonsums und Berechnung eines geschätzten Blutalkoholwerts (BAC in ‰). Der Fokus liegt auf **Harm-Reduction** (bewusster trinken, persönliche Limits unterstützen).

> **Wichtiger Hinweis:** Die berechneten BAC-Werte sind **Schätzungen** und dienen ausschließlich der Selbstreflexion. Diese App ist **nicht** geeignet zur Beurteilung der Fahrtüchtigkeit oder für andere sicherheitsrelevante Entscheidungen.

## Features

- **Nutzerprofil**: Erfassung von Gewicht und biologischem Profil für genauere BAC-Schätzungen
- **Schnelles Getränke-Logging**: Presets für gängige Getränke (Bier, Wein, Shot, Longdrink) oder benutzerdefinierte Eingabe
- **BAC-Anzeige**: Aktueller geschätzter Promillewert mit "voraussichtlich nüchtern um"-Prognose
- **BAC-Verlaufskurve**: Visualisierung des Alkoholabbaus über Zeit
- **Tagesziele**: Persönliches Limit setzen mit sanften Erinnerungen bei Erreichen/Überschreiten
- **Kalender-Historie**: Monatsübersicht mit Tagesindikatoren (alkoholfrei/moderat/über Limit)
- **Statistiken**: Wöchentliche/monatliche Zusammenfassungen

## Tech Stack

- **Platform**: React Native (Expo)
- **Sprache**: TypeScript (strict mode)
- **State Management**: Zustand
- **Datenbank**: SQLite (expo-sqlite)
- **Charts**: react-native-svg-charts
- **Navigation**: Expo Router

## Projektstruktur

```
drink-tracking/
├── app/                    # Expo Router Screens
│   ├── (tabs)/            # Tab-Navigation (Home, Kalender, Statistik, Profil)
│   ├── (modals)/          # Modal-Screens (Getränk hinzufügen, Ziel erreicht)
│   ├── _layout.tsx        # Root Layout
│   └── onboarding.tsx     # Onboarding Screen
├── src/
│   ├── domain/            # Business Logic Layer
│   │   ├── models/        # TypeScript Types
│   │   ├── services/      # BAC-Berechnung, Validation, Statistik
│   │   └── constants/     # Defaults und Konstanten
│   ├── data/              # Data Layer
│   │   ├── database/      # SQLite Schema und Connection
│   │   └── repositories/  # CRUD-Operationen
│   └── ui/                # UI Layer
│       ├── components/    # Wiederverwendbare Komponenten
│       ├── hooks/         # Zustand Stores
│       └── theme/         # Farben, Spacing, Typography
├── __tests__/             # Unit Tests
└── docs/                  # Design-Assets und Spezifikation
```

## Setup

### Voraussetzungen

- Node.js >= 18
- npm oder yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) oder Android Emulator

### Installation

```bash
# Repository klonen
git clone <repo-url>
cd drink-tracking

# Dependencies installieren
npm install

# App starten
npm start
```

### Befehle

```bash
# Entwicklungsserver starten
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Tests ausführen
npm test
```

## BAC-Berechnung

Die App verwendet eine vereinfachte Widmark-Formel:

### Alkoholmenge

```
gramsAlcohol = volumeMl × (abvPercent / 100) × 0.789
```

- `0.789 g/ml` = Dichte von Ethanol

### BAC-Anstieg

```
bacIncreasePermille = gramsAlcohol / (weightKg × r)
```

- `r` = Körperwasseranteil
  - Männlich: 0.68 (typischer Standardwert)
  - Weiblich: 0.55 (typischer Standardwert)

### Absorption

- Lineare Absorption über 40 Minuten (konfigurierbar)
- Gradueller Anstieg des BAC-Beitrags

### Abbau

- Linearer Abbau: Standard 0.15‰ pro Stunde (konfigurierbar)
- Optionen: Langsam (0.10‰/h), Standard (0.15‰/h), Schnell (0.20‰/h)

### Limitationen

Diese Berechnung ist eine **Schätzung** und berücksichtigt nicht:
- Mageninhalt / Nahrungsaufnahme
- Individuelle Metabolismusunterschiede
- Medikamente oder Gesundheitszustände
- Körperzusammensetzung (Muskelmasse vs. Fett)

## Datenschutz

- **Alle Daten werden lokal auf dem Gerät gespeichert**
- Keine Cloud-Synchronisation der Getränkedaten
- Keine Tracking-Dienste oder Analytics

## Lizenz

Private Nutzung. Nicht zur kommerziellen Verwendung freigegeben.
