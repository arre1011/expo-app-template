# E2E Test Specification

Dieses Template enthält bewusst keine fertigen produktionsnahen E2E-Flows mehr.

Grund:

- E2E-Tests sind stark app-spezifisch
- alte Flows aus der Drink-App wären hier irreführend
- ein generisches Template sollte keine falschen Smoke-Tests vortäuschen

## Empfehlung für neue Apps

Baue pro neuer App zuerst 3 kleine Maestro-Flows:

1. Onboarding-Smoketest
2. Home-Screen-Smoke mit wichtigster Primäraktion
3. Paywall-/Subscription-Smoke

## Minimale E2E-Abdeckung

| Priorität | Flow |
|------|-------|
| P0 | App startet und Onboarding endet erfolgreich |
| P0 | wichtigste Primäraktion auf Home funktioniert |
| P0 | Paywall lädt und kann geschlossen oder gekauft werden |
| P1 | Reminder-Flow / Trial-Reminder öffnet korrekt |
| P1 | Settings-Screen und Legal-Routen öffnen |

## Ablage

- Maestro-Konfig: `.maestro/config.yaml`
- Flows: `.maestro/flows/`

## Hinweis

Vor dem Schreiben von Maestro-Flows zuerst `appId` in `.maestro/config.yaml` auf die echte App setzen.
