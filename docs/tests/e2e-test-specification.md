# E2E Test Specification

Dieses Dokument beschreibt alle End-to-End Tests für die Drink-Tracking App. Die Tests werden mit **Maestro** implementiert, dem von Expo empfohlenen E2E-Testing-Framework.

---

## Inhaltsverzeichnis

1. [Test-Strategie](#1-test-strategie)
2. [Test-Umgebung](#2-test-umgebung)
3. [Kritische Flows (P0)](#3-kritische-flows-p0)
4. [Wichtige Flows (P1)](#4-wichtige-flows-p1)
5. [Session-Management Tests (P1)](#5-session-management-tests-p1)
6. [Cross-View-Konsistenz Tests (P1)](#6-cross-view-konsistenz-tests-p1)
7. [Kalender & Status-Dots Tests (P2)](#7-kalender--status-dots-tests-p2)
8. [Weitere Tests (P2/P3)](#8-weitere-tests-p2p3)
9. [Test-IDs Referenz](#9-test-ids-referenz)

---

## 1. Test-Strategie

### Testing Pyramid

| Ebene | Anteil | Tool | Fokus |
|-------|--------|------|-------|
| Unit Tests | ~70% | Jest | BAC-Berechnung, Validierung, Session-Logik |
| Integration Tests | ~20% | Jest + RNTL | Store-Interaktionen, Cross-View-Konsistenz |
| E2E Tests | ~10% | Maestro | Kritische User-Workflows |

### Warum E2E Tests?

E2E Tests verifizieren, was Unit-Tests nicht koennen:
- Echte Touch-Interaktionen auf iOS/Android
- Navigation zwischen Screens
- Daten-Persistenz nach App-Neustart
- Visuelle Korrektheit (Farben, Layout)
- Timing-abhaengige Flows (Modals, Animationen)

### Priorisierung

| Prioritaet | Beschreibung | Tests |
|------------|--------------|-------|
| **P0** | App ist ohne diese Funktion unbenutzbar | Onboarding, Drink hinzufuegen, Limit-Modal |
| **P1** | Wichtige Funktionen, haeufige Bug-Quellen | Session-Splits, Cross-View-Konsistenz |
| **P2** | Nice-to-have, weniger kritisch | Custom Drinks, Statistik-Details |
| **P3** | Edge Cases, selten genutzt | Monats-Navigation, Export |

---

## 2. Test-Umgebung

### Voraussetzungen

```bash
# Maestro CLI installieren
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verifizieren
maestro --version
```

### Verzeichnisstruktur

```
drink-tracking/
├── .maestro/
│   ├── config.yaml           # Globale Konfiguration
│   ├── flows/
│   │   ├── onboarding/
│   │   │   ├── complete-profile.yaml
│   │   │   └── validation-errors.yaml
│   │   ├── drinks/
│   │   │   ├── add-preset-drink.yaml
│   │   │   ├── add-custom-drink.yaml
│   │   │   ├── edit-drink.yaml
│   │   │   └── delete-drink.yaml
│   │   ├── limits/
│   │   │   ├── limit-reached-water-first.yaml
│   │   │   ├── limit-reached-break.yaml
│   │   │   ├── limit-exceeded-log-anyway.yaml
│   │   │   └── limit-exceeded-cancel.yaml
│   │   ├── sessions/
│   │   │   ├── session-split-on-delete.yaml
│   │   │   ├── session-merge-on-add.yaml
│   │   │   └── session-exceeds-limit.yaml
│   │   ├── calendar/
│   │   │   ├── status-dot-colors.yaml
│   │   │   ├── day-detail-navigation.yaml
│   │   │   └── cross-view-consistency.yaml
│   │   └── persistence/
│   │       └── data-survives-restart.yaml
│   └── utils/
│       ├── setup-profile.yaml
│       └── add-drinks-to-limit.yaml
```


---

## 3. Kritische Flows (P0)

### 3.1 Onboarding - Profil erstellen

**Test-ID:** `ONB-001`

**Ziel:** Verifizieren, dass ein neuer Benutzer erfolgreich ein Profil erstellen kann und zur Home-Ansicht gelangt.

**Vorbedingung:** Frische App-Installation (keine Profildaten)

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | App starten (clearState: true) | Onboarding-Screen wird angezeigt |
| 2 | Pruefen: "Your Profile" sichtbar | Titel ist sichtbar |
| 3 | Pruefen: Pflichtfelder angezeigt | "Weight", "Biological Profile" sichtbar |
| 4 | Gewicht eingeben: "75" | Eingabe wird akzeptiert |
| 5 | Pruefen: Gruener Haken erscheint | Validierungs-Icon sichtbar |
| 6 | "Female" antippen | Option wird ausgewaehlt |
| 7 | Pruefen: "Ready to start!" erscheint | Formular ist vollstaendig |
| 8 | "Start" antippen | Navigation wird ausgefuehrt |
| 9 | Pruefen: Home-Screen angezeigt | "Ready for today?" sichtbar |

**Maestro Flow:**

```yaml
# .maestro/flows/onboarding/complete-profile.yaml
appId: ${APP_ID}
tags:
  - p0
  - onboarding
  - smoke
---
- launchApp:
    clearState: true

# Pruefen: Onboarding-Screen wird angezeigt
- assertVisible: "Your Profile"
- assertVisible: "Weight"
- assertVisible: "Biological Profile"

# Gewicht eingeben
- tapOn:
    id: "weight-input"
- inputText: "75"

# Pruefen: Validierung erfolgreich
- assertVisible:
    id: "weight-valid-icon"

# Biologisches Profil auswaehlen
- tapOn: "Female"

# Pruefen: Formular vollstaendig
- assertVisible: "Ready to start!"

# Absenden
- tapOn: "Start"

# Pruefen: Home-Screen wird angezeigt
- assertVisible: "Ready for today?"
- assertVisible: "Log drink"
```

**Erwartetes Ergebnis:** Benutzer sieht den leeren Home-Screen mit "Ready for today?"

---

### 3.2 Getraenk hinzufuegen (Preset)

**Test-ID:** `DRK-001`

**Ziel:** Verifizieren, dass ein Preset-Getraenk erfolgreich hinzugefuegt wird und BAC aktualisiert wird.

**Vorbedingung:** Profil existiert, keine aktive Session

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | App starten | Home-Screen mit "Ready for today?" |
| 2 | "Log drink" antippen | Add-Drink-Modal oeffnet sich |
| 3 | Pruefen: Presets sichtbar | "Small Beer", "Wine", etc. angezeigt |
| 4 | "Small Beer" antippen | Preset wird ausgewaehlt |
| 5 | "Save" antippen | Modal schliesst sich |
| 6 | Pruefen: BAC wird angezeigt | Promille-Wert > 0 sichtbar |
| 7 | Pruefen: Drink in Liste | "Small Beer" in Drink-Liste |

**Maestro Flow:**

```yaml
# .maestro/flows/drinks/add-preset-drink.yaml
appId: ${APP_ID}
tags:
  - p0
  - drinks
  - smoke
---
- launchApp

# Pruefen: Leerer Home-Screen
- assertVisible: "Ready for today?"

# Getraenk hinzufuegen
- tapOn: "Log drink"

# Pruefen: Add-Drink-Modal oeffnet sich
- assertVisible: "Add Drink"
- assertVisible: "Small Beer"
- assertVisible: "Large Beer"
- assertVisible: "Wine"
- assertVisible: "Shot"

# Preset auswaehlen
- tapOn: "Small Beer"

# Speichern
- tapOn: "Save"

# Pruefen: Zurueck auf Home-Screen mit BAC-Anzeige
- assertVisible:
    text: ".*‰.*"
    regex: true
- assertVisible: "Drinks"
- assertVisible: "Small Beer"
```

**Erwartetes Ergebnis:** Drink erscheint in der Liste, BAC-Wert > 0 wird angezeigt

---

### 3.3 Limit erreicht - "Water First" Flow

**Test-ID:** `LIM-001`

**Ziel:** Verifizieren, dass bei Erreichen des BAC-Limits das Modal erscheint und "Water First" das Getraenk NICHT speichert.

**Vorbedingung:**
- Profil existiert
- BAC-Limit auf 0.5‰ gesetzt
- Aktueller BAC nahe am Limit (durch vorherige Drinks)

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Setup: BAC nahe am Limit bringen | Vorherige Drinks hinzugefuegt |
| 2 | Neuen Drink hinzufuegen | Add-Drink-Modal oeffnet |
| 3 | "Small Beer" auswaehlen + Save | Goal-Reached-Modal erscheint |
| 4 | Pruefen: Modal-Inhalt | "You've reached your limit" sichtbar |
| 5 | Pruefen: Optionen | "Water First", "10-Min Break", "Log anyway" |
| 6 | "Water First" antippen | Confetti-Animation startet |
| 7 | Pruefen: Celebration | "Great decision!" erscheint |
| 8 | Warten: 3 Sekunden | Modal schliesst automatisch |
| 9 | Pruefen: Drink NICHT gespeichert | Drink-Anzahl unveraendert |

**Maestro Flow:**

```yaml
# .maestro/flows/limits/limit-reached-water-first.yaml
appId: ${APP_ID}
tags:
  - p0
  - limits
  - harm-reduction
---
- launchApp

# Setup: Drinks hinzufuegen bis nahe am Limit
- runFlow: ../utils/add-drinks-to-limit.yaml

# Anzahl der Drinks merken (fuer spaetere Pruefung)
- assertVisible:
    id: "drink-count"

# Letzten Drink hinzufuegen, der Limit erreicht
- tapOn:
    id: "fab-add-drink"
- tapOn: "Small Beer"
- tapOn: "Save"

# Pruefen: Goal-Reached-Modal erscheint
- assertVisible: "You've reached your limit"
- assertVisible: "Water First"
- assertVisible: "10-Min Break"
- assertVisible: "Log anyway"

# "Water First" waehlen
- tapOn: "Water First"

# Pruefen: Confetti-Animation und Celebration
- assertVisible: "Great decision!"

# Warte auf Auto-Dismiss (3 Sekunden)
- extendedWaitUntil:
    notVisible: "Great decision!"
    timeout: 5000

# Pruefen: Getraenk wurde NICHT hinzugefuegt
# (Die Drink-Anzahl sollte gleich geblieben sein)
- assertNotVisible:
    id: "new-drink-indicator"
```

**Erwartetes Ergebnis:** Modal erscheint, bei "Water First" wird kein Drink gespeichert, Confetti-Celebration wird angezeigt

---

### 3.4 Limit ueberschritten - "Log anyway" Flow

**Test-ID:** `LIM-002`

**Ziel:** Verifizieren, dass bei "Log anyway" das Getraenk trotz Ueberschreitung gespeichert wird.

**Vorbedingung:**
- Profil existiert
- BAC-Limit bereits ueberschritten

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Setup: BAC ueber Limit | Limit bereits ueberschritten |
| 2 | Neuen Drink hinzufuegen | Add-Drink-Modal oeffnet |
| 3 | "Large Beer" auswaehlen + Save | Goal-Exceeded-Modal erscheint |
| 4 | Pruefen: Modal-Inhalt | "You're over your limit" sichtbar |
| 5 | "Log anyway" antippen | Modal schliesst |
| 6 | Pruefen: Drink gespeichert | "Large Beer" in Drink-Liste |

**Maestro Flow:**

```yaml
# .maestro/flows/limits/limit-exceeded-log-anyway.yaml
appId: ${APP_ID}
tags:
  - p0
  - limits
---
- launchApp

# Setup: Ueber Limit bringen
- runFlow: ../utils/add-drinks-to-limit.yaml
- runFlow: ../utils/add-one-more-drink.yaml

# Weiteren Drink hinzufuegen
- tapOn:
    id: "fab-add-drink"
- tapOn: "Large Beer"
- tapOn: "Save"

# Pruefen: Goal-Exceeded-Modal erscheint (staerkerer Hinweis)
- assertVisible: "You're over your limit"
- assertVisible: "Log anyway"

# "Log anyway" waehlen
- tapOn: "Log anyway"

# Pruefen: Zurueck auf Home, Drink wurde gespeichert
- assertVisible: "Large Beer"
- assertVisible: "Drinks"
```

**Erwartetes Ergebnis:** Drink wird gespeichert, Benutzer kehrt zum Home-Screen zurueck

---

## 4. Wichtige Flows (P1)

### 4.1 Getraenk loeschen

**Test-ID:** `DRK-002`

**Ziel:** Verifizieren, dass ein Getraenk geloescht werden kann und aus allen Views verschwindet.

**Vorbedingung:** Mindestens ein Getraenk existiert

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Pruefen: Drink existiert | "Small Beer" sichtbar |
| 2 | Drink antippen | Edit-Modal oeffnet |
| 3 | Loeschen-Button antippen | Bestaetigung-Alert erscheint |
| 4 | "Delete" bestaetigen | Modal schliesst |
| 5 | Pruefen: Drink verschwunden | "Small Beer" nicht mehr sichtbar |
| 6 | Pruefen: Leerer Zustand | "Ready for today?" (wenn letzter Drink) |

**Maestro Flow:**

```yaml
# .maestro/flows/drinks/delete-drink.yaml
appId: ${APP_ID}
tags:
  - p1
  - drinks
---
- launchApp

# Setup: Sicherstellen dass Drink existiert
- runFlow: ../utils/ensure-one-drink.yaml

# Pruefen: Drink existiert
- assertVisible: "Small Beer"

# Drink antippen zum Bearbeiten
- tapOn: "Small Beer"

# Pruefen: Edit-Modal oeffnet sich
- assertVisible: "Edit Drink"

# Loeschen-Button antippen
- tapOn:
    id: "delete-button"

# Bestaetigen im Alert
- tapOn: "Delete"

# Pruefen: Zurueck auf Home-Screen, Drink verschwunden
- assertVisible: "Ready for today?"
- assertNotVisible: "Small Beer"
```

**Erwartetes Ergebnis:** Drink verschwindet, bei 0 Drinks erscheint "Ready for today?"

---

### 4.2 Getraenk bearbeiten

**Test-ID:** `DRK-003`

**Ziel:** Verifizieren, dass ein bestehendes Getraenk bearbeitet werden kann.

**Vorbedingung:** Mindestens ein Getraenk existiert

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Drink antippen | Edit-Modal oeffnet |
| 2 | Pruefen: Aktuelle Werte | Vorhandene Werte werden angezeigt |
| 3 | Auf "Custom" wechseln | Custom-Formular oeffnet |
| 4 | Volumen aendern: "500" | Neuer Wert eingegeben |
| 5 | "Save" antippen | Modal schliesst |
| 6 | Pruefen: BAC aktualisiert | BAC-Wert hat sich geaendert |

**Maestro Flow:**

```yaml
# .maestro/flows/drinks/edit-drink.yaml
appId: ${APP_ID}
tags:
  - p1
  - drinks
---
- launchApp

# Setup: Sicherstellen dass Drink existiert
- runFlow: ../utils/ensure-one-drink.yaml

# Drink antippen zum Bearbeiten
- tapOn: "Small Beer"

# Pruefen: Edit-Modal oeffnet sich
- assertVisible: "Edit Drink"

# Auf Custom wechseln
- tapOn: "Custom"

# Volumen aendern
- clearText:
    id: "volume-input"
- inputText: "500"

# Speichern
- tapOn: "Save"

# Pruefen: Zurueck auf Home, BAC wurde neu berechnet
- assertVisible:
    text: ".*‰.*"
    regex: true
```

**Erwartetes Ergebnis:** Drink wird aktualisiert, BAC wird neu berechnet

---

## 5. Session-Management Tests (P1)

### 5.1 Session wird gesplittet bei Drink-Loeschung

**Test-ID:** `SES-001`

**Ziel:** Verifizieren, dass beim Loeschen eines Drinks in der Mitte einer Session diese in zwei separate Sessions aufgeteilt wird.

**Fachlicher Hintergrund:**
Eine Session ist definiert als der Zeitraum vom ersten Drink bis BAC = 0. Wenn ein Drink geloescht wird und dadurch eine zeitliche Luecke entsteht, in der BAC = 0 war, muss die Session in zwei Sessions aufgeteilt werden.

**Szenario:**
```
Vor dem Loeschen:
Session 1: [Drink A: 20:00] → [Drink B: 21:00] → [Drink C: 22:00]
           |_________________ durchgehend BAC > 0 _______________|

Nach dem Loeschen von Drink B (falls BAC dazwischen auf 0 faellt):
Session 1: [Drink A: 20:00] → BAC = 0 um 20:45
Session 2: [Drink C: 22:00] → BAC = 0 um 23:xx
```

**Vorbedingung:**
- Profil existiert
- Eine Session mit mindestens 3 Drinks, zeitlich so verteilt, dass Loeschen des mittleren Drinks zu Split fuehrt

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Setup: 3 Drinks mit zeitlichem Abstand | Session mit 3 Drinks existiert |
| 2 | Pruefen: Eine Session angezeigt | Session-Header zeigt Zeitraum |
| 3 | Mittleren Drink antippen | Edit-Modal oeffnet |
| 4 | Loeschen-Button antippen | Bestaetigung-Alert |
| 5 | "Delete" bestaetigen | Session wird neu berechnet |
| 6 | Pruefen: Zwei Sessions existieren | Zwei separate Session-Eintraege |
| 7 | Pruefen: Kalender zeigt beide Tage | Korrekte Status-Dots |

**Maestro Flow:**

```yaml
# .maestro/flows/sessions/session-split-on-delete.yaml
appId: ${APP_ID}
tags:
  - p1
  - sessions
  - complex
---
- launchApp:
    clearState: true

# Setup: Profil erstellen
- runFlow: ../utils/setup-profile.yaml

# Drink 1 hinzufuegen (frueh)
- tapOn: "Log drink"
- tapOn: "Small Beer"
# Zeit auf 18:00 setzen
- tapOn:
    id: "time-picker-button"
- selectTime: "18:00"
- tapOn: "Done"
- tapOn: "Save"

# Drink 2 hinzufuegen (mitte) - dieser wird spaeter geloescht
- tapOn:
    id: "fab-add-drink"
- tapOn: "Small Beer"
# Zeit auf 19:00 setzen
- tapOn:
    id: "time-picker-button"
- selectTime: "19:00"
- tapOn: "Done"
- tapOn: "Save"

# Drink 3 hinzufuegen (spaet - mit grossem Abstand)
- tapOn:
    id: "fab-add-drink"
- tapOn: "Small Beer"
# Zeit auf 23:00 setzen (grosser Abstand, damit Split moeglich)
- tapOn:
    id: "time-picker-button"
- selectTime: "23:00"
- tapOn: "Done"
- tapOn: "Save"

# Pruefen: Eine Session mit 3 Drinks
- assertVisible: "Drinks"
- assertVisible:
    id: "drink-count-3"

# Mittleren Drink loeschen (19:00 Uhr)
- tapOn:
    text: ".*19:00.*"
    regex: true
- assertVisible: "Edit Drink"
- tapOn:
    id: "delete-button"
- tapOn: "Delete"

# Pruefen: Session wurde gesplittet
# Die aktuelle Ansicht sollte jetzt nur noch 2 Drinks zeigen
# oder zwei separate Sessions anzeigen
- assertVisible:
    id: "past-sessions-section"

# Pruefen: In "Past Sessions" erscheint eine weitere Session
- assertVisible: "Past Sessions"
```

**Erwartetes Ergebnis:**
- Urspruengliche Session wird in zwei Sessions aufgeteilt
- Beide Sessions sind navigierbar
- Kalender zeigt korrekte Tage mit Sessions

---

### 5.2 Sessions werden gemerged bei Drink-Hinzufuegung

**Test-ID:** `SES-002`

**Ziel:** Verifizieren, dass beim Hinzufuegen eines Drinks, der die Luecke zwischen zwei Sessions schliesst, diese zu einer Session zusammengefuegt werden.

**Fachlicher Hintergrund:**
Wenn ein Drink so hinzugefuegt wird, dass der BAC nicht mehr auf 0 faellt zwischen zwei bestehenden Sessions, muessen diese Sessions gemerged werden.

**Szenario:**
```
Vor dem Hinzufuegen:
Session 1: [Drink A: 18:00] → BAC = 0 um 19:30
Session 2: [Drink B: 22:00] → BAC = 0 um 23:30

Nach dem Hinzufuegen von Drink C um 19:15:
Session 1: [Drink A: 18:00] → [Drink C: 19:15] → [Drink B: 22:00]
           |_________________ durchgehend BAC > 0 _________________|
```

**Vorbedingung:**
- Profil existiert
- Zwei separate Sessions existieren

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Setup: Zwei separate Sessions erstellen | Zwei Sessions existieren |
| 2 | Pruefen: "Past Sessions" zeigt 2 Eintraege | Beide Sessions sichtbar |
| 3 | Neuen Drink hinzufuegen zwischen Sessions | Add-Drink-Modal oeffnet |
| 4 | Zeit so setzen, dass Luecke geschlossen wird | Zeit zwischen beiden Sessions |
| 5 | "Save" antippen | Session-Merge wird ausgefuehrt |
| 6 | Pruefen: Nur noch eine Session | Eine Session mit allen Drinks |

**Maestro Flow:**

```yaml
# .maestro/flows/sessions/session-merge-on-add.yaml
appId: ${APP_ID}
tags:
  - p1
  - sessions
  - complex
---
- launchApp:
    clearState: true

# Setup: Profil erstellen
- runFlow: ../utils/setup-profile.yaml

# Session 1: Drink um 18:00
- tapOn: "Log drink"
- tapOn: "Small Beer"
- tapOn:
    id: "time-picker-button"
- selectTime: "18:00"
- tapOn: "Done"
- tapOn: "Save"

# Warten bis BAC = 0 (simuliert durch Zeitsprung oder kleinen Drink)
# Fuer Test: Session 2 mit grossem zeitlichen Abstand

# Session 2: Drink um 23:00 (nachdem BAC von Session 1 = 0)
- tapOn:
    id: "fab-add-drink"
- tapOn: "Small Beer"
- tapOn:
    id: "time-picker-button"
- selectTime: "23:00"
- tapOn: "Done"
- tapOn: "Save"

# Pruefen: Zwei Sessions existieren (oder eine mit Unterbrechung)
# Je nach Implementierung: Past Sessions oder Session-Navigation

# Jetzt: Drink hinzufuegen, der Luecke schliesst
- tapOn:
    id: "fab-add-drink"
- tapOn: "Large Beer"  # Groesserer Drink, damit BAC laenger > 0
- tapOn:
    id: "time-picker-button"
- selectTime: "19:00"  # Zwischen den beiden Sessions
- tapOn: "Done"
- tapOn: "Save"

# Pruefen: Sessions wurden gemerged
# Alle 3 Drinks sollten jetzt in einer Session sein
- assertVisible: "Drinks"
# Die Drink-Liste sollte alle 3 Drinks zeigen
```

**Erwartetes Ergebnis:**
- Zwei Sessions werden zu einer Session zusammengefuegt
- Alle Drinks erscheinen in der gleichen Session
- BAC-Kurve zeigt durchgehenden Verlauf

---

### 5.3 Session ueberschreitet Limit durch zusaetzlichen Drink

**Test-ID:** `SES-003`

**Ziel:** Verifizieren, dass wenn ein Drink eine bestehende Session vergroessert und dadurch das Limit ueberschritten wird, das entsprechende Modal erscheint.

**Fachlicher Hintergrund:**
Ein nachtraeglich hinzugefuegter Drink kann den Peak-BAC einer Session erhoehen und dadurch ein Limit ueberschreiten.

**Vorbedingung:**
- Profil existiert
- BAC-Limit auf 0.5‰ gesetzt
- Aktive Session mit BAC knapp unter Limit

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Setup: Session mit BAC knapp unter Limit | Session existiert, BAC < Limit |
| 2 | Pruefen: Kein Limit-Warning angezeigt | Goal-Progress zeigt "moderate" |
| 3 | Weiteren Drink hinzufuegen | Add-Drink-Modal |
| 4 | "Large Beer" auswaehlen + Save | Limit wird ueberschritten |
| 5 | Pruefen: Goal-Modal erscheint | "reached" oder "exceeded" Modal |
| 6 | Kalender pruefen | Status-Dot wechselt zu rot |

**Maestro Flow:**

```yaml
# .maestro/flows/sessions/session-exceeds-limit.yaml
appId: ${APP_ID}
tags:
  - p1
  - sessions
  - limits
---
- launchApp

# Setup: Session nahe am Limit
- runFlow: ../utils/add-drinks-near-limit.yaml

# Pruefen: Limit noch nicht erreicht
- assertVisible:
    id: "goal-progress-moderate"

# Drink hinzufuegen, der Limit ueberschreitet
- tapOn:
    id: "fab-add-drink"
- tapOn: "Large Beer"
- tapOn: "Save"

# Pruefen: Goal-Modal erscheint
- assertVisible:
    anyOf:
      - "You've reached your limit"
      - "You're over your limit"

# Modal schliessen (Log anyway)
- tapOn: "Log anyway"

# Pruefen: Goal-Progress zeigt jetzt "over limit"
- assertVisible:
    id: "goal-progress-over-limit"

# Kalender pruefen
- tapOn: "Calendar"

# Pruefen: Heutiger Tag hat roten Status-Dot
- assertVisible:
    id: "status-dot-error"
```

**Erwartetes Ergebnis:**
- Limit-Modal erscheint beim Hinzufuegen des Drinks
- Kalender-Status-Dot wechselt von gelb/gruen zu rot
- Goal-Progress zeigt "over limit"

---

## 6. Cross-View-Konsistenz Tests (P1)

### 6.1 Home ↔ Kalender Konsistenz

**Test-ID:** `CVC-001`

**Ziel:** Verifizieren, dass ein hinzugefuegter Drink sowohl auf dem Home-Screen als auch im Kalender erscheint.

**Vorbedingung:** Profil existiert, keine Drinks heute

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Drink hinzufuegen | Drink in Home-Liste |
| 2 | Zu Kalender wechseln | Kalender-Tab oeffnet |
| 3 | Pruefen: Status-Dot fuer heute | Farbiger Punkt unter heutigem Datum |
| 4 | Auf heute tippen | Day-Detail oeffnet |
| 5 | Pruefen: Drink in Day-Detail | Gleicher Drink wie auf Home |

**Maestro Flow:**

```yaml
# .maestro/flows/calendar/cross-view-consistency.yaml
appId: ${APP_ID}
tags:
  - p1
  - calendar
  - consistency
---
- launchApp:
    clearState: true

# Setup: Profil erstellen
- runFlow: ../utils/setup-profile.yaml

# 1. Drink hinzufuegen
- tapOn: "Log drink"
- tapOn: "Wine"
- tapOn: "Save"

# 2. Pruefen: Drink auf Home-Screen
- assertVisible: "Wine"

# 3. Zum Kalender wechseln
- tapOn: "Calendar"

# 4. Pruefen: Heute hat einen Status-Dot
- assertVisible:
    id: "today-cell"
- assertVisible:
    id: "status-dot"

# 5. Auf heute tippen
- tapOn:
    id: "today-cell"

# 6. Pruefen: Day-Detail zeigt den Drink
- assertVisible: "Wine"
```

**Erwartetes Ergebnis:** Drink erscheint konsistent in Home und Kalender

---

### 6.2 Drink loeschen - Cross-View Update

**Test-ID:** `CVC-002`

**Ziel:** Verifizieren, dass nach Loeschen eines Drinks alle Views aktualisiert werden.

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Drink loeschen (auf Home) | Drink verschwindet |
| 2 | Zu Kalender wechseln | Status-Dot hat sich geaendert |
| 3 | Zu Statistik wechseln | Zahlen wurden aktualisiert |
| 4 | Zurueck zu Home | Konsistenter Zustand |

**Maestro Flow:**

```yaml
# .maestro/flows/calendar/delete-updates-all-views.yaml
appId: ${APP_ID}
tags:
  - p1
  - calendar
  - consistency
---
- launchApp

# Setup: Sicherstellen dass Drink existiert
- runFlow: ../utils/ensure-one-drink.yaml

# Drink loeschen
- tapOn: "Small Beer"
- tapOn:
    id: "delete-button"
- tapOn: "Delete"

# Pruefen: Home zeigt leeren Zustand
- assertVisible: "Ready for today?"

# Kalender pruefen
- tapOn: "Calendar"

# Pruefen: Kein Status-Dot fuer heute (oder "sober")
- assertNotVisible:
    id: "status-dot-warning"
- assertNotVisible:
    id: "status-dot-error"

# Statistik pruefen
- tapOn: "Statistics"

# Pruefen: Drink-Count ist 0 (oder nicht vorhanden)
- assertVisible: "0"
```

**Erwartetes Ergebnis:** Alle Views zeigen konsistent den aktualisierten Zustand

---

## 7. Kalender & Status-Dots Tests (P2)

### 7.1 Status-Dot Farben

**Test-ID:** `CAL-001`

**Ziel:** Verifizieren, dass die Kalender-Status-Dots die korrekten Farben anzeigen.

**Fachlicher Hintergrund:**
- **Gruen (sober):** Kein Alkohol an diesem Tag / unter Schwellwert
- **Gelb (moderate):** Alkohol getrunken, aber unter Limit
- **Rot (over_limit):** Peak-BAC hat Limit erreicht oder ueberschritten

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Ohne Drinks: Kalender oeffnen | Kein Status-Dot fuer heute |
| 2 | Kleinen Drink hinzufuegen | Gruener oder gelber Dot |
| 3 | Weitere Drinks bis Limit | Dot wechselt zu gelb |
| 4 | Limit ueberschreiten | Dot wechselt zu rot |

**Maestro Flow:**

```yaml
# .maestro/flows/calendar/status-dot-colors.yaml
appId: ${APP_ID}
tags:
  - p2
  - calendar
  - visual
---
- launchApp:
    clearState: true

# Setup: Profil erstellen
- runFlow: ../utils/setup-profile.yaml

# Scenario A: Kein Drink → Kein Dot
- tapOn: "Calendar"
- assertNotVisible:
    id: "status-dot-today"

# Scenario B: Ein kleiner Drink → Gruener/Gelber Dot
- tapOn: "Session"
- tapOn: "Log drink"
- tapOn: "Small Beer"
- tapOn: "Save"
- tapOn: "Calendar"
- assertVisible:
    anyOf:
      - id: "status-dot-success"
      - id: "status-dot-warning"

# Scenario C: Ueber Limit → Roter Dot
- tapOn: "Session"
# Mehrere Drinks hinzufuegen bis ueber Limit
- runFlow: ../utils/add-drinks-over-limit.yaml
- tapOn: "Calendar"
- assertVisible:
    id: "status-dot-error"
```

**Erwartetes Ergebnis:** Farbcodierung entspricht dem BAC-Status

---

### 7.2 Kalender-Navigation zwischen Monaten

**Test-ID:** `CAL-002`

**Ziel:** Verifizieren, dass die Kalender-Navigation zwischen Monaten funktioniert.

**Testschritte:**

| Schritt | Aktion | Erwartetes Ergebnis |
|---------|--------|---------------------|
| 1 | Kalender oeffnen | Aktueller Monat angezeigt |
| 2 | Zurueck-Pfeil antippen | Vorheriger Monat wird angezeigt |
| 3 | "Today" antippen | Zurueck zum aktuellen Monat |
| 4 | Vor-Pfeil antippen | Naechster Monat wird angezeigt |

**Maestro Flow:**

```yaml
# .maestro/flows/calendar/month-navigation.yaml
appId: ${APP_ID}
tags:
  - p2
  - calendar
---
- launchApp
- tapOn: "Calendar"

# Aktuellen Monat merken
- assertVisible:
    text: ".*January.*2026.*"
    regex: true

# Zurueck zum vorherigen Monat
- tapOn:
    id: "nav-previous"
- assertVisible:
    text: ".*December.*2025.*"
    regex: true

# "Today" antippen
- tapOn: "Today"
- assertVisible:
    text: ".*January.*2026.*"
    regex: true
```

**Erwartetes Ergebnis:** Navigation zwischen Monaten funktioniert korrekt

---

## 8. Weitere Tests (P2/P3)

### 8.1 Custom Drink erstellen

**Test-ID:** `DRK-004`

**Ziel:** Verifizieren, dass benutzerdefinierte Getraenke erstellt werden koennen.

**Maestro Flow:**

```yaml
# .maestro/flows/drinks/add-custom-drink.yaml
appId: ${APP_ID}
tags:
  - p2
  - drinks
---
- launchApp
- tapOn: "Log drink"

# Custom-Option oeffnen
- tapOn: "Custom"

# Werte eingeben
- tapOn:
    id: "volume-input"
- inputText: "500"

- tapOn:
    id: "abv-input"
- inputText: "4.9"

- tapOn:
    id: "label-input"
- inputText: "Craft IPA"

# Speichern
- tapOn: "Save"

# Pruefen: Custom-Drink erscheint
- assertVisible: "Craft IPA"
```

---

### 8.2 Daten-Persistenz nach App-Neustart

**Test-ID:** `PER-001`

**Ziel:** Verifizieren, dass alle Daten nach App-Neustart erhalten bleiben.

**Maestro Flow:**

```yaml
# .maestro/flows/persistence/data-survives-restart.yaml
appId: ${APP_ID}
tags:
  - p1
  - persistence
  - critical
---
- launchApp

# Setup: Drink hinzufuegen
- runFlow: ../utils/ensure-one-drink.yaml

# Pruefen: Drink existiert
- assertVisible: "Small Beer"

# App beenden und neu starten (OHNE clearState!)
- stopApp
- launchApp

# Pruefen: Drink ist noch da
- assertVisible: "Small Beer"
- assertVisible: "Drinks"
```

---

### 8.3 Statistik-Konsistenz

**Test-ID:** `STA-001`

**Ziel:** Verifizieren, dass die Statistik-Ansicht korrekte Werte anzeigt.

**Maestro Flow:**

```yaml
# .maestro/flows/statistics/basic-stats.yaml
appId: ${APP_ID}
tags:
  - p2
  - statistics
---
- launchApp

# Drinks hinzufuegen
- runFlow: ../utils/add-two-drinks.yaml

# Zur Statistik navigieren
- tapOn: "Statistics"

# Pruefen: Werte sind korrekt
- assertVisible: "2"  # Anzahl Drinks diese Woche
- assertVisible: "1"  # Anzahl Trinktage
```

---

## 9. Test-IDs Referenz

Folgende `testID` Attribute muessen in den React Native Komponenten gesetzt werden, damit Maestro die Elemente finden kann:

### Onboarding Screen

| Element | testID |
|---------|--------|
| Weight Input | `weight-input` |
| Weight Valid Icon | `weight-valid-icon` |
| Female Button | `sex-female` |
| Male Button | `sex-male` |

### Home Screen

| Element | testID |
|---------|--------|
| FAB (Add Drink) | `fab-add-drink` |
| Drink Count | `drink-count` |
| Goal Progress (Moderate) | `goal-progress-moderate` |
| Goal Progress (Over Limit) | `goal-progress-over-limit` |
| Past Sessions Section | `past-sessions-section` |

### Add Drink Modal

| Element | testID |
|---------|--------|
| Volume Input | `volume-input` |
| ABV Input | `abv-input` |
| Label Input | `label-input` |
| Time Picker Button | `time-picker-button` |
| Delete Button | `delete-button` |

### Calendar Screen

| Element | testID |
|---------|--------|
| Today Cell | `today-cell` |
| Status Dot (Success/Green) | `status-dot-success` |
| Status Dot (Warning/Yellow) | `status-dot-warning` |
| Status Dot (Error/Red) | `status-dot-error` |
| Navigation Previous | `nav-previous` |
| Navigation Next | `nav-next` |

### Goal Modal

| Element | testID |
|---------|--------|
| Water First Button | `btn-water-first` |
| Break Button | `btn-break` |
| Log Anyway Button | `btn-log-anyway` |

---

## Anhang: Utility Flows

### setup-profile.yaml

```yaml
# .maestro/utils/setup-profile.yaml
appId: ${APP_ID}
---
- tapOn:
    id: "weight-input"
- inputText: "75"
- tapOn: "Female"
- tapOn: "Start"
- assertVisible: "Ready for today?"
```

### add-drinks-to-limit.yaml

```yaml
# .maestro/utils/add-drinks-to-limit.yaml
appId: ${APP_ID}
---
# Fuegt Drinks hinzu bis kurz vor Limit
- tapOn: "Log drink"
- tapOn: "Small Beer"
- tapOn: "Save"

- tapOn:
    id: "fab-add-drink"
- tapOn: "Small Beer"
- tapOn: "Save"
```

### ensure-one-drink.yaml

```yaml
# .maestro/utils/ensure-one-drink.yaml
appId: ${APP_ID}
---
# Stellt sicher dass mindestens ein Drink existiert
- runFlow:
    when:
      visible: "Ready for today?"
    file: add-preset-drink.yaml
```

---

*Dokumentversion: 1.0*
*Erstellt: 13. Januar 2026*
*Autor: Claude Code*
