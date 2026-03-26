# Template Strategy

Dieses Repo ist die gemeinsame Ausgangsbasis für neue Apps.

## Ziel

Nicht jede neue App von null beginnen, sondern mit einer sauberen, generischen Infrastruktur starten:

- Navigation
- Theme
- Settings
- Subscription-Handling
- Notifications
- Kalender-/Journal-Bausteine
- wiederverwendbare UI-Patterns

## Prinzip

Eine neue App soll in zwei Schritten entstehen:

1. Template kopieren
2. App-Identität, Integrationen und Produktlogik austauschen

## Was bewusst zentral im Template bleibt

- Routing-Struktur
- Theme-Tokens
- Paywall- und Subscription-Infrastruktur
- Reminder-Mechanik
- grundlegende Persistence-Patterns

## Was bewusst pro App neu gesetzt wird

- Name, Slug, Scheme
- Bundle ID / Package Name
- RevenueCat-App und Keys
- PostHog-Projekt und Key
- Sentry-Projekt und DSN
- Legal-Texte
- Produktcopy

## Später möglich

Wenn mehrere echte Apps dieselben Bausteine stabil teilen, kann man daraus separate Pakete machen. Bis dahin ist dieses Repo die pragmatische Single-Template-Lösung.
