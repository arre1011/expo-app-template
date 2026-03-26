# Test Suite

Dieses Template bringt keine domain-spezifischen Tests mehr mit.

## Empfehlung für neue Apps

Schreibe zuerst Tests für:

- Validierung neuer Domain-Modelle
- kritische Services / Use Cases
- Reminder- und Subscription-Logik, falls verändert

## Struktur

- `__tests__/setup.ts` bleibt als gemeinsames Test-Setup erhalten
- neue Tests sollten app-spezifisch und klein anfangen

## Grundsatz

Das Template soll keine alten Tests mit falschen Annahmen über dein neues Produkt mitziehen.
