# SQLite Datenbank – Zugriff & Debugging

## Datenbankdatei finden

Die App verwendet SQLite mit dem Dateinamen `drink_tracking.db`.

### 1. Aktuellen Simulator ermitteln

```bash
xcrun simctl list devices | grep Booted
```

Beispielausgabe:
```
iPhone 16 Pro Max (B32552AC-D48A-4818-8989-20696F7BDB7C) (Booted)
```

### 2. Datenbankpfad ermitteln

```bash
find ~/Library/Developer/CoreSimulator/Devices/<SIMULATOR_ID>/data/Containers/Data/Application -name "drink_tracking.db"
```

`<SIMULATOR_ID>` durch die ID aus Schritt 1 ersetzen.

**Vollständiger Einzeiler (aktuellen Simulator automatisch erkennen):**

```bash
find ~/Library/Developer/CoreSimulator/Devices/$(xcrun simctl list devices | grep Booted | grep -oE '[A-F0-9-]{36}')/data/Containers/Data/Application -name "drink_tracking.db"
```

---

## Datenbank öffnen

### Option A: VSCode Extension (empfohlen)

1. Extension **SQLite Viewer** in VSCode installieren
2. In VSCode **Cmd+O** drücken
3. Den gefundenen Pfad zur `drink_tracking.db` einfügen und öffnen
4. Die Extension zeigt alle Tabellen als interaktive Tabelle an

### Option B: SQLite CLI (macOS vorinstalliert)

```bash
sqlite3 /pfad/zur/drink_tracking.db
```

Nützliche Befehle:
```sql
.tables                    -- Alle Tabellen anzeigen
.schema DrinkEntry         -- Schema einer Tabelle anzeigen
SELECT * FROM DrinkEntry;  -- Alle Einträge anzeigen
.quit                      -- Beenden
```

### Option C: DB Browser for SQLite (Desktop-App)

- Download: https://sqlitebrowser.org/dl/
- Nach der Installation in den Applications-Ordner verschieben
- Dann per Terminal öffnen:

```bash
open -a "DB Browser for SQLite" /pfad/zur/drink_tracking.db
```

---

## Tabellen-Übersicht

| Tabelle | Beschreibung |
|---|---|
| `DrinkEntry` | Einzelne Getränkeeinträge |
| `Session` | Trinksessions (erste bis letzte BAC=0) |
| `UserProfile` | Nutzerprofil (Gewicht, Geschlecht etc.) |
| `DailyGoal` | Tagesziele |

---

## Hinweis

Die Datenbank liegt im Simulator-Verzeichnis und wird bei jedem Neustart der App **nicht** zurückgesetzt. Zum Zurücksetzen den Simulator unter **Device → Erase All Content and Settings** löschen.
