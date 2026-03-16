# Per-Session Limit statt Tages-Limit

## Problem

Das BAC-Limit ist aktuell **pro Tag** gespeichert (`daily_goal`-Tabelle, `date` ist UNIQUE). Das funktioniert in den meisten Fällen, hat aber einen Edge Case:

**Mehrere Sessions an einem Tag mit unterschiedlichen Limits**

Beispiel: Ein User trinkt mittags ein Bier zum Essen (Limit 0.3‰) und geht abends auf eine Party (Limit 1.0‰). Aktuell teilen sich beide Sessions das gleiche Tages-Limit — der User kann nicht pro Session ein individuelles Limit setzen.

## Aktuelle Architektur

- **Limit-Speicherung:** `daily_goal`-Tabelle mit `date TEXT NOT NULL UNIQUE` und `max_bac REAL`
- **Sessions werden dynamisch berechnet:** Bei jeder Drink-Änderung werden ALLE Sessions von Grund auf neu berechnet (Merge Overlapping Intervals Algorithmus in `sessionCalculator.ts`). Sessions haben kein eigenes Limit-Feld.
- **Fallback-Kette:** `daily_goal[date]` → `getDefaultGoalSettings()` (letzter gesetzter Wert) → `0.5‰`

## Warum man nicht einfach ein Limit an die Session hängen kann

Sessions sind **abgeleitete Daten**, keine stabilen Entitäten:

- Session-IDs können sich bei Recalculation ändern (z.B. wenn ein Drink zwischen zwei Sessions eingefügt wird, können sie zu einer Session verschmelzen)
- `syncSessionsFromBoundaries()` löscht alle Sessions und erstellt sie neu
- Ein `limit`-Feld an der Session würde bei jeder Recalculation verloren gehen

## Gewünschtes Verhalten (Ziel)

- User kann **pro Session** ein individuelles Limit setzen
- Beim Start einer neuen Session wird das zuletzt gesetzte Limit als Default übernommen
- In der Kalender-Tagesansicht werden Sessions mit ihren jeweiligen Limits angezeigt
- Statistiken und Awards berechnen "over limit" pro Session, nicht pro Tag

## Mögliche Lösungsansätze (zu evaluieren)

### 1. Limit an Drinks heften

Jeder Drink bekommt ein `session_limit`-Feld. Beim Recalculate wird das Limit der Session aus dem ersten Drink der Session abgeleitet.

- **Vorteil:** Überlebt Recalculation, da Drinks stabil sind
- **Nachteil:** Redundante Daten, Limit-Änderung muss alle Drinks der Session updaten

### 2. Session-Limit-Tabelle

Separate Tabelle `session_limit(session_id, max_bac)` die nach Recalculation gemappt wird (z.B. über Zeiträume).

- **Vorteil:** Saubere Trennung
- **Nachteil:** Komplexes Mapping nach Recalculation, Session-IDs ändern sich

### 3. Sessions stabilisieren

Session-IDs stabil machen (nicht bei jedem Recalculate neu erstellen). Dann kann ein Limit direkt an die Session.

- **Vorteil:** Sauberste Architektur langfristig
- **Nachteil:** Großes Refactoring des Merge-Algorithmus und `syncSessionsFromBoundaries()`

## Betroffene Dateien

- `src/data/database/schema.ts` — Schema-Erweiterung
- `src/domain/services/sessionCalculator.ts` — Limit-Zuordnung bei Recalculation
- `src/domain/services/sessionService.ts` — Orchestrierung
- `src/data/repositories/sessionRepository.ts` — CRUD
- `src/domain/services/statistics.ts` — Auswertung per Session statt per Tag
- `src/domain/services/awardCalculator.ts` — Streak-Berechnung
- `src/ui/sheets/DayDetailSheet.tsx` — Limit pro Session anzeigen/editieren
- `src/ui/hooks/useCalendarStore.ts` — Kalender-Farben pro Session

## Akzeptanzkriterien

- [ ] User kann pro Session ein eigenes Limit setzen
- [ ] Limit überlebt Session-Recalculation (Drink hinzufügen/löschen/editieren)
- [ ] Default-Limit für neue Sessions = zuletzt gesetzter Wert
- [ ] Kalender zeigt korrekte Farben bei mehreren Sessions mit unterschiedlichen Limits am selben Tag
- [ ] Statistiken berechnen "under/over limit" pro Session
- [ ] Bestehende Tests grün + neue Tests für Multi-Session-Limit-Szenarien
