# Session-basierte Architektur

## Zusammenfassung

Eine **Session** ist der Zeitraum vom ersten Getränk bis zum Zeitpunkt, an dem der BAC (Blood Alcohol Content) wieder auf 0 fällt.

**Kernprinzip**: Sessions werden als *abgeleitete Daten* behandelt. Getränke sind die Single Source of Truth. Bei jeder Änderung (Hinzufügen, Bearbeiten, Löschen) werden ALLE Sessions vollständig neu berechnet.

---

## 1. Architektur-Übersicht

### Schichten

| Schicht | Datei | Verantwortlichkeit |
|---------|-------|-------------------|
| UI/State | `src/ui/hooks/useAppStore.ts` | Zustand Store, ruft Service-Funktionen auf |
| Service | `src/domain/services/sessionService.ts` | Orchestrierung: Lädt Daten, ruft Calculator, speichert Ergebnisse |
| Calculator | `src/domain/services/sessionCalculator.ts` | Reine Berechnungsfunktionen (kein DB-Zugriff) |
| Repository | `src/data/repositories/sessionRepository.ts` | CRUD-Operationen für Sessions in SQLite |

### Datenfluss

```
UI Layer (useAppStore)
       ↓
Service Layer (sessionService)
       ↓
   ┌───┴───┐
   ↓       ↓
Calculator  Repository
(reine Fn)  (DB-Ops)
```

---

## 2. Der "Merge Overlapping Intervals" Algorithmus

### Kernproblem

Wenn ein Getränk hinzugefügt wird, kann es sein, dass es mit einer bestehenden Session überlappt oder sogar zwei Sessions verbindet.

### Lösung: Batch-Neuberechnung

Bei JEDER Änderung werden ALLE Sessions von Grund auf neu berechnet:

1. **Sortieren**: Alle Getränke nach Zeitstempel sortieren
2. **Intervalle berechnen**: Für jedes Getränk Start- und Endzeit (Nüchternzeit) berechnen
3. **Merge**: Überlappende Intervalle zusammenführen
4. **Session-Daten**: Für jede Gruppe Peak-BAC, Peak-Time, Standard Units berechnen

**Wichtig**: Wenn zwei Intervalle überlappen, wird die Nüchternzeit NEU berechnet (nicht `max(end1, end2)`), weil sich der Alkohol addiert!

### Beispiel: Retroaktives Getränk

```
Ausgangslage: Getränk A um 14:00 (Session endet 17:00)

Neues Getränk B um 13:00 hinzugefügt:

1. Sortieren → [B(13:00), A(14:00)]
2. Intervall B: 13:00 → 16:00
3. Intervall A: 14:00 → 17:00
4. Überlappung? A.start (14:00) <= B.end (16:00) → JA!
5. Kombinierte Nüchternzeit neu berechnen → 18:30

Ergebnis: EINE Session mit beiden Getränken
```

---

## 3. Datenfluss bei Operationen

### 3.1 Getränk Hinzufügen

```
addDrink()
    ↓
Prüfe BAC-Limit (fresh data aus DB)
    ↓ (User bestätigt oder Limit OK)
saveDrinkDirectly()
    ↓
Getränk in DB speichern
    ↓
sessionService.processNewDrink()
    ↓
recalculateAllSessions()
    ├→ Alle Getränke aus DB laden
    ├→ Sessions berechnen (Merge Overlapping Intervals)
    └→ Sessions in DB synchronisieren
    ↓
UI-State aktualisieren (loadTodayData)
    ↓
Events emittieren (drinksChanged, sessionsChanged)
```

### 3.2 Getränk Löschen

```
removeDrink(id)
    ↓
ZUERST: Getränk aus DB löschen!
    ↓
recalculateAllSessions()
    ↓
UI-State aktualisieren
    ↓
Events emittieren
```

**KRITISCH**: Das Getränk MUSS gelöscht sein, BEVOR Sessions neu berechnet werden!

**Mögliche Ergebnisse:**
- Session bleibt (mit weniger Getränken)
- Session wird kürzer (neue Nüchternzeit)
- Session wird gelöscht (letztes Getränk)
- Session wird GETEILT (Lücke entsteht)

### 3.3 Getränk Bearbeiten

```
updateDrink(id, drink)
    ↓
Getränk in DB aktualisieren
    ↓
recalculateAllSessions()
    ↓
UI-State aktualisieren
    ↓
Events emittieren
```

**Mögliche Ergebnisse bei Zeitstempel-Änderung:**
- Getränk wechselt zu anderer Session
- Zwei Sessions werden zusammengeführt
- Eine Session wird aufgeteilt

---

## 4. Edge Cases

### 4.1 Retroaktives Getränk führt zu Session-Merge

```
Ausgangslage:
- Session A: 14:00-17:00 (1 Bier)
- Session B: 20:00-23:00 (2 Wein)

Neues Getränk: Shot um 17:30 mit genug Alkohol

Ergebnis: EINE Session: 14:00-23:XX (alle Getränke)
```

### 4.2 Getränk löschen kann Session teilen

```
Ausgangslage:
- Session: 14:00-22:00 mit 3 Getränken (14:00, 17:00, 20:00)

Lösche Getränk um 17:00

Ergebnis:
- Session A: 14:00-17:00 (erstes Bier)
- Session B: 20:00-23:00 (drittes Bier)
```

---

## 5. Datenmodell

### Session

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | INTEGER | Primary Key |
| start_time | TEXT | ISO 8601, Zeitstempel des ersten Getränks |
| end_time | TEXT | ISO 8601, berechnete Nüchternzeit |
| peak_bac | REAL | Höchster BAC-Wert |
| peak_time | TEXT | ISO 8601, Zeitpunkt des Peak |
| total_standard_units | REAL | Summe aller Standard Units |

### DrinkEntry (Session-Referenz)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| session_id | INTEGER | Foreign Key zu session.id (nullable) |

---

## 6. Datenbank-Synchronisation

Die Funktion `syncSessionsFromBoundaries` synchronisiert berechnete Sessions mit der DB:

1. Alle Drink-Session-Zuordnungen aufheben (`session_id = NULL`)
2. Alle bestehenden Sessions löschen
3. Neue Sessions erstellen
4. Drinks den neuen Sessions zuordnen

**Warum "Delete All and Recreate"?**
- Einfachheit: Keine komplexe Diff-Logik
- Konsistenz garantiert: Keine verwaisten Referenzen
- Performance: Bei typischer Nutzung (<100 Sessions) vernachlässigbar
- Testbarkeit: Gleiches Ergebnis bei gleichen Inputs

---

## 7. Event-System

Nach jeder Änderung werden Events emittiert:

| Event | Wann |
|-------|------|
| `drinksChanged` | Nach Add/Edit/Delete eines Getränks |
| `sessionsChanged` | Nach Session-Neuberechnung |

Listener (Kalender, Statistiken) reagieren und laden ihre Daten neu.

---

## 8. Performance

### Warum "Recalculate All" funktioniert

- **Typische Nutzung**: < 10 Getränke pro Session, < 100 Sessions
- **Algorithmus**: O(n log n) - sortieren + linearer Durchlauf
- **DB-Operationen**: Batch-Updates sind schnell in SQLite
- **Keine komplexe Logik**: Keine Merge/Split-Detection, keine Rekursion

---

## 9. Test-Abdeckung

Die Session-Logik ist getestet in `__tests__/sessionCalculator.test.ts`:

| Test-Kategorie | Beschreibung |
|----------------|--------------|
| Basis-Funktionalität | Einzelnes Getränk, mehrere Getränke am Tag |
| Retroaktive Getränke | Getränk vor bestehender Session hinzufügen |
| Session-Merging | Zwei Sessions durch neues Getränk verbinden |
| Multi-Day Sessions | Sessions über Mitternacht |
| Überlappungs-Erkennung | Interval overlap detection |
| Edge Cases | Leere Listen, gleiche Zeitstempel |

---

*Letzte Aktualisierung: 20. Januar 2026*
