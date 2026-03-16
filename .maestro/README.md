# Maestro E2E Tests

Dieses Verzeichnis enthaelt End-to-End Tests fuer die Drink Tracking App, implementiert mit [Maestro](https://maestro.mobile.dev/).

## Voraussetzungen

### 1. Maestro CLI installieren

```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verifizieren
maestro --version
```

### 2. App bauen

Fuer E2E Tests muss die App als Development Build oder Release Build vorliegen:

```bash
# iOS Simulator Build
npx expo run:ios

# Android Emulator Build
npx expo run:android
```

**Wichtig:** Maestro funktioniert NICHT mit Expo Go. Du brauchst einen nativen Build.

## Tests ausfuehren

### Einzelnen Test ausfuehren

```bash
# Add Drink Test
maestro test .maestro/flows/drinks/add-preset-drink.yaml
```

### Alle Tests ausfuehren

```bash
maestro test .maestro/flows/
```

### Mit spezifischem Geraet

```bash
# iOS
maestro test --device "iPhone 15" .maestro/flows/drinks/add-preset-drink.yaml

# Android (Geraete-ID aus `adb devices`)
maestro test --device emulator-5554 .maestro/flows/drinks/add-preset-drink.yaml
```

### Tests mit Tags filtern

```bash
# Nur Smoke Tests
maestro test --include-tags=smoke .maestro/flows/

# Nur P0 (kritische) Tests
maestro test --include-tags=p0 .maestro/flows/
```

## Verzeichnisstruktur

```
.maestro/
├── config.yaml           # Globale Konfiguration
├── README.md             # Diese Datei
├── flows/
│   ├── drinks/           # Getraenk-bezogene Tests
│   │   ├── add-preset-drink.yaml
│   │   ├── add-custom-drink.yaml
│   │   ├── edit-drink.yaml
│   │   └── delete-drink.yaml
│   ├── onboarding/       # Onboarding Tests
│   ├── limits/           # BAC Limit Tests
│   ├── sessions/         # Session-Management Tests
│   ├── calendar/         # Kalender Tests
│   └── persistence/      # Daten-Persistenz Tests
└── utils/
    ├── setup-profile.yaml    # Profil-Erstellung Utility
    └── add-drinks-to-limit.yaml
```

## Debugging

### Maestro Studio (interaktiver Modus)

```bash
maestro studio
```

Oeffnet eine GUI, in der du:
- Die App live sehen kannst
- Elemente inspizieren kannst
- Flows Schritt fuer Schritt ausfuehren kannst

### Ausfuehrliches Logging

```bash
maestro test --debug .maestro/flows/drinks/add-preset-drink.yaml
```

## Test-IDs

Die folgenden `testID` Attribute sind in den React Native Komponenten definiert:

### Home Screen
- `empty-title` - "Ready for today?" Text
- `btn-log-drink` - Log drink Button
- `fab-add-drink` - Floating Action Button
- `drinks-section` - Drinks Liste Container

### Add Drink Modal
- `add-drink-title` - Modal Titel
- `presets-grid` - Grid mit Drink-Presets
- `preset-beer_small` - Small Beer Preset
- `preset-beer_large` - Large Beer Preset
- `preset-wine` - Wine Preset
- `preset-longdrink` - Longdrink Preset
- `preset-shot` - Shot Preset
- `btn-save-drink` - Save Button
- `btn-delete-drink` - Delete Button (nur im Edit-Modus)

## Haeufige Probleme

### "App not found"
- Stelle sicher, dass die App installiert ist
- Pruefe die Bundle ID in `config.yaml` (com.drinktracking.app)

### "Element not found"
- Pruefe ob das Element eine `testID` hat
- Nutze `maestro studio` zum Debuggen
- Elemente koennen Zeit brauchen - nutze `extendedWaitUntil`

### Tests sind flaky
- Nutze `extendedWaitUntil` statt `assertVisible` fuer dynamische Inhalte
- Erhoehe Timeouts wenn noetig
- Stelle sicher, dass `clearState: true` fuer isolierte Tests genutzt wird
