# Zukünftige Features

Diese Datei enthält Features, die für zukünftige Versionen der App vorgesehen sind, aber nicht Teil des MVP sind.

## Streak-Tracking

**Beschreibung:**
Anzeige einer "Streak" (Serie) von aufeinanderfolgenden alkoholfreien Tagen im Kalender-Screen.

**Details:**
- Eine Card zeigt die aktuelle Anzahl aufeinanderfolgender "nüchterner" Tage an
- Icon: Flammen-Symbol (🔥) zur visuellen Darstellung
- Anzeige: "Aktueller Streak: X Tage"
- Berechnung basiert auf Tagen mit Status `sober` im aktuellen Monat

**Motivation:**
- Positive Verstärkung für alkoholfreie Phasen
- Gamification-Element zur Motivation
- Visualisierung von Fortschritt und Erfolgen

**Implementierungshinweise:**
- Streak-Berechnung sollte über Monatsgrenzen hinweg funktionieren
- Streak wird zurückgesetzt bei einem Tag mit Alkoholkonsum
- Evtl. zusätzliche Statistiken: längster Streak, durchschnittlicher Streak, etc.
- Optional: Benachrichtigungen bei Meilensteinen (7, 14, 30, 60, 90 Tage)

**UI-Referenz:**
- Ursprüngliche Implementierung war eine Card unterhalb der Kalender-Legende
- Design: Flexbox-Layout mit Label, Wert und Icon
- Farben: Primary-Color für Icon mit transparentem Hintergrund

**Status:** Für MVP entfernt (Stand: Dezember 2025)

---

## Kalender Jahresansicht

**Beschreibung:**
Erweiterung des Kalenders um eine Jahresansicht im Apple-Kalender-Stil. Der Nutzer kann zwischen Monats- und Jahresansicht wechseln.

**Ist-Zustand:**
- Nur Monatsansicht verfügbar
- Custom-Implementierung ohne externe Kalender-Bibliothek
- Verwendet `date-fns` für Datumslogik

**Soll-Zustand:**
- Jahresansicht zeigt alle 12 Monate in einem 3×4 Grid
- Jeder Mini-Monat zeigt Status-Punkte (sober/moderate/over_limit)
- Tap auf einen Monat navigiert zur Monatsansicht
- Toggle zwischen Jahr/Monat-Ansicht (wie Apple Kalender)

**UI-Konzept:**
```
┌─────────────────────────────┐
│  < 2026          [Toggle]   │
├─────────────────────────────┤
│  Jan       Feb       Mar    │
│  □□□□□□□   □□□□□□□   □□□□□□□│
│  □□□□□□□   □□□□□□□   □□□□□□□│
│  □□□□□□□   □□□□□□□   □□□□□□□│
│  □□□□□□□   □□□□□□□   □□□□□□□│
│  □□□□□     □□□□      □□□□□□ │
├─────────────────────────────┤
│  Apr       May       Jun    │
│  ...       ...       ...    │
├─────────────────────────────┤
│  Jul       Aug       Sep    │
│  ...       ...       ...    │
├─────────────────────────────┤
│  Oct       Nov       Dec    │
│  ...       ...       ...    │
└─────────────────────────────┘
```

**Recherche-Ergebnis (Januar 2026):**

Keine React Native Kalender-Bibliothek bietet eine native Apple-style Jahresansicht:
- **react-native-calendars** (Wix): Nur Monat, CalendarList (scrollbar), Agenda
- **react-native-calendar-kit**: Day/Week-Views, keine Jahresansicht
- **Andere Libraries**: Ebenfalls keine Jahresansicht

**Empfehlung:** Selbst implementieren

**Implementierungsvorschlag:**

1. **Neue Komponenten:**
   - `YearView.tsx` - 3×4 Grid mit 12 MiniMonth-Komponenten
   - `MiniMonth.tsx` - Kompakter Monatskalender (nur kleine Zellen/Punkte)

2. **Wiederverwendbare Architektur:**
   - `useCalendarStore` erweitern um `loadYearData(year: number)`
   - `DayStatus`-Farben können wiederverwendet werden
   - Bestehende Repository-Methoden nutzen

3. **Navigation:**
   - Toggle-Button im Header (Icon oder Segmented Control)
   - Tap auf Mini-Monat → wechselt zu Monatsansicht mit diesem Monat
   - Jahr-Navigation mit Pfeilen oder Swipe

4. **Performance:**
   - Lazy Loading: Nur sichtbare Monate laden
   - Oder: Alle 12 Monate auf einmal laden (überschaubare Datenmenge)

**Aufwand:** Mittel - Die Logik existiert bereits, nur UI-Erweiterung nötig

**Referenzen:**
- Apple Kalender (iOS) als Design-Vorlage
- [react-native-calendars](https://github.com/wix/react-native-calendars)
- [Medium: Grid Calendar Implementation](https://medium.com/swlh/how-i-built-horizontal-as-well-as-grid-calendar-in-react-native-using-react-native-calendars-eb7a2edcc5db)

**Status:** Geplant (Stand: Januar 2026)
