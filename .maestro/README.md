# Maestro E2E Tests

Dieses Verzeichnis ist nur ein Startpunkt.

Das Template enthält absichtlich keine alten produktionsspezifischen Flows mehr. Lege die Maestro-Flows pro neuer App neu an.

## Minimaler Start

1. `appId` in `.maestro/config.yaml` setzen
2. `.maestro/flows/` anlegen
3. mit 2-3 Smoke-Tests beginnen:
   - Onboarding
   - wichtigste Primäraktion
   - Paywall / Settings

## App bauen

```bash
npx expo run:ios
npx expo run:android
```

Maestro funktioniert nicht mit Expo Go.

## Tests ausführen

```bash
maestro test .maestro/flows/
```
