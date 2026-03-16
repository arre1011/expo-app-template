# Zukünftige Migration: Session-basiertes Limit-System (Version 4)

**Status:** Konzeptionelle Planung
**Aktuell implementiert:** Version 1 (Tages-basierte Limits)
**Erstellt:** 2025-12-30

## Zusammenfassung

Dieses Dokument beschreibt die geplante Migration von tages-basierten Limits (Version 1) zu einem session-basierten Limit-System (Version 4). Die Migration wurde nach User-Feedback zurückgestellt, um zunächst mit der einfacheren tages-basierten Lösung zu starten.

---

## Aktueller Stand: Version 1 (Tages-basiert)

### Implementierung

Die app verwendet aktuell ein **tages-basiertes Limit-System**:

- **Einheiten-Limit**: Maximal X Getränke pro Kalendertag
- **Promille-Limit**: Maximal Y‰ Peak-BAC pro Kalendertag (optional)
- **Limit-Prüfung**: Beide Limits werden unabhängig geprüft
- **Kalender**: Tage werden grün/orange/rot gefärbt basierend auf Limit-Status
- **Statistiken**: "X Tage über Limit" pro Monat

### Vorteile

✅ Einfach zu verstehen (jeder Tag ist unabhängig)
✅ Klare Kalender-Darstellung
✅ Schnell zu implementieren
✅ Wenig Komplexität

### Nachteile

❌ **Mitternachts-Problem**: Trinken über Mitternacht kann Limits "umgehen"
  - Beispiel: 2 Einheiten um 23:30, dann 2 Einheiten um 00:30 = 4 Einheiten in einer Session, aber beide Tage unter Limit (3)

❌ **Statistik-Verzerrung**: Multi-Day-Sessions färben mehrere Tage rot
  - Beispiel: 1 Session von Fr 23:00 bis Sa 01:00 = 2 Tage "über Limit" in Statistik

❌ **Nicht optimal für Harm Reduction**: Medizinisch relevante Einheit ist die Session, nicht der Tag

---

## Zukünftige Version 4: Session-basiertes System

### Konzept

Das **session-basierte System** behandelt Sessions als primäre Einheit für Limit-Tracking:

**Definition "Session":**
- Eine Session beginnt, wenn BAC von 0‰ auf > 0‰ steigt
- Eine Session endet, wenn BAC wieder auf 0‰ zurückkehrt
- Sessions können über Mitternacht gehen (Multi-Day-Sessions)

**Limits gelten pro Session:**
- Maximal X Einheiten pro Session
- Maximal Y‰ Peak-BAC pro Session

### Implementierungs-Plan

#### 1. Datenmodell-Erweiterungen

**Neue Tabelle: `drinking_session`**

```sql
CREATE TABLE drinking_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_timestamp TEXT NOT NULL,
  end_timestamp TEXT,  -- NULL wenn Session noch aktiv
  start_date TEXT NOT NULL,  -- YYYY-MM-DD (für Kalender-Zuordnung)
  peak_bac REAL NOT NULL,
  drink_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_session_start_date ON drinking_session(start_date);
CREATE INDEX idx_session_start_timestamp ON drinking_session(start_timestamp);
```

**Erweitere `drink_entry`:**

```sql
ALTER TABLE drink_entry ADD COLUMN session_id INTEGER REFERENCES drinking_session(id);
CREATE INDEX idx_drink_entry_session_id ON drink_entry(session_id);
```

**Erweitere `daily_goal` (optional):**

```sql
-- Wenn gewünscht: Separate Session-Limits vs. Tages-Limits
ALTER TABLE daily_goal ADD COLUMN max_session_drinks INTEGER;
ALTER TABLE daily_goal ADD COLUMN max_session_bac REAL;
```

#### 2. Session-Detection Service

Erstelle `src/domain/services/sessionDetector.ts`:

```typescript
interface DrinkingSession {
  id: number | null;  // null wenn neu
  startTimestamp: Date;
  endTimestamp: Date | null;  // null wenn aktiv
  startDate: string;  // YYYY-MM-DD
  drinks: DrinkEntry[];
  peakBAC: number;
  drinkCount: number;
  affectedDates: string[];  // ['2024-01-15', '2024-01-16']
}

/**
 * Erkennt Sessions basierend auf BAC-Zeitreihe
 * Eine Session ist aktiv solange BAC > 0
 */
export function detectSessions(
  drinks: DrinkEntry[],
  profile: UserProfile
): DrinkingSession[] {
  // 1. Sortiere Drinks chronologisch
  // 2. Für jeden Drink: prüfe ob vorherige Drinks zu BAC > 0 führen
  // 3. Wenn BAC = 0 vor diesem Drink → neue Session startet
  // 4. Gruppiere Drinks in Sessions
  // 5. Berechne peakBAC und affectedDates für jede Session
}

/**
 * Findet die aktuell aktive Session (falls vorhanden)
 */
export function getCurrentSession(
  drinks: DrinkEntry[],
  profile: UserProfile
): DrinkingSession | null {
  // Ähnlich wie filterDrinksToCurrentSession() aber gibt Session-Objekt zurück
}
```

#### 3. Session-Repository

Erstelle `src/data/repositories/sessionRepository.ts`:

```typescript
/**
 * Erstellt oder aktualisiert eine Session
 */
export async function upsertSession(
  session: Omit<DrinkingSession, 'id'>
): Promise<DrinkingSession> {
  // INSERT oder UPDATE drinking_session
  // UPDATE drink_entry.session_id für alle Drinks in der Session
}

/**
 * Holt alle Sessions für einen Monat
 */
export async function getSessionsForMonth(
  year: number,
  month: number
): Promise<DrinkingSession[]> {
  // SELECT basierend auf start_date
}

/**
 * Beendet eine aktive Session
 */
export async function endSession(
  sessionId: number,
  endTimestamp: Date
): Promise<void> {
  // UPDATE drinking_session SET end_timestamp = ...
}
```

#### 4. Limit-Checking (Session-basiert)

Erweitere `src/domain/services/statistics.ts`:

```typescript
/**
 * Prüft Session-Limits statt Tages-Limits
 */
export function checkSessionLimits(
  session: DrinkingSession,
  goal: DailyGoal | SessionGoal
): 'within' | 'drinks_reached' | 'bac_reached' | 'both_exceeded' {
  const drinksOK = session.drinkCount <= goal.maxDrinks;
  const bacOK = !goal.maxBAC || session.peakBAC <= goal.maxBAC;

  if (!drinksOK && !bacOK) return 'both_exceeded';
  if (!drinksOK) return 'drinks_reached';
  if (!bacOK) return 'bac_reached';
  return 'within';
}
```

#### 5. Kalender-Anpassungen

**Problem:** Wie zeigt man Multi-Day-Sessions im Kalender?

**Lösung:**

```
Mo Di Mi Do Fr Sa So
●  ●     ●● ●→ ●→

● = Session innerhalb eines Tages (grün/orange/rot)
●● = Session über Limit
●→ = Folge-Tag einer Multi-Day-Session (verblasst, Pfeil-Icon)
```

**Implementierung:**

```typescript
interface CalendarDay {
  date: Date;
  dateString: string;
  drinkCount: number;
  status: 'sober' | 'moderate' | 'over_limit' | 'no_data';
  isSessionContinuation: boolean;  // NEU: Ist dies ein Folge-Tag?
  sessionStartDate?: string;  // NEU: Von welchem Tag startete die Session?
}

export function getDayStatus(
  sessions: DrinkingSession[],
  date: Date
): CalendarDay {
  const dateString = format(date, 'yyyy-MM-dd');

  // Finde Sessions, die diesen Tag betreffen
  const sessionsThisDay = sessions.filter(s =>
    s.affectedDates.includes(dateString)
  );

  if (sessionsThisDay.length === 0) {
    return {
      date,
      dateString,
      drinkCount: 0,
      status: 'sober',
      isSessionContinuation: false,
    };
  }

  // Prüfe ob Tag Start oder Folge-Tag einer Session ist
  const isStartDay = sessionsThisDay.some(s => s.startDate === dateString);
  const isSessionContinuation = !isStartDay && sessionsThisDay.length > 0;

  // Status basierend auf Session-Limits
  const status = determineStatusFromSessions(sessionsThisDay);

  return {
    date,
    dateString,
    drinkCount: sessionsThisDay.reduce((sum, s) => sum + s.drinkCount, 0),
    status,
    isSessionContinuation,
    sessionStartDate: isSessionContinuation ? sessionsThisDay[0].startDate : undefined,
  };
}
```

#### 6. Statistiken (Session-basiert)

```typescript
interface PeriodStats {
  totalDrinks: number;
  totalSessions: number;  // GEÄNDERT: statt "drinkingDays"
  sessionsOverLimit: number;  // NEU
  activeDays: number;  // Tage mit mindestens 1 Getränk
  peakBAC: number;
  averageSessionPeakBAC: number;  // NEU
  averageDrinksPerSession: number;  // NEU
}

export function calculatePeriodStats(
  sessions: DrinkingSession[],
  startDate: Date,
  endDate: Date
): PeriodStats {
  const periodSessions = sessions.filter(s => {
    const start = parseISO(s.startDate);
    return isWithinInterval(start, { start: startDate, end: endDate });
  });

  const sessionsOverLimit = periodSessions.filter(s =>
    checkSessionLimits(s, goal) !== 'within'
  ).length;

  const totalDrinks = periodSessions.reduce((sum, s) => sum + s.drinkCount, 0);
  const totalSessions = periodSessions.length;

  const activeDates = new Set<string>();
  periodSessions.forEach(s => {
    s.affectedDates.forEach(d => activeDates.add(d));
  });

  return {
    totalDrinks,
    totalSessions,
    sessionsOverLimit,
    activeDays: activeDates.size,
    peakBAC: Math.max(...periodSessions.map(s => s.peakBAC)),
    averageSessionPeakBAC: totalSessions > 0
      ? periodSessions.reduce((sum, s) => sum + s.peakBAC, 0) / totalSessions
      : 0,
    averageDrinksPerSession: totalSessions > 0
      ? totalDrinks / totalSessions
      : 0,
  };
}
```

#### 7. UI-Anpassungen

**Home-Screen:**

```tsx
// Zeige aktive Session statt "heute"
{currentSession && (
  <Card>
    <Text>Aktuelle Session</Text>
    <Text>Gestartet: {format(currentSession.startTimestamp, 'HH:mm, dd.MM.')}</Text>
    <Text>Dauer: {calculateSessionDuration(currentSession)}</Text>

    <GoalProgress
      currentDrinks={currentSession.drinkCount}
      maxDrinks={goal.maxDrinks}
      currentBAC={currentSession.peakBAC}
      maxBAC={goal.maxBAC}
      title="Session-Limit"  // Angepasst
    />
  </Card>
)}
```

**Kalender:**

```tsx
<TouchableOpacity
  style={[
    styles.dayCircle,
    day.isSessionContinuation && styles.dayContinuation
  ]}
>
  {day.isSessionContinuation && (
    <View style={styles.continuationIndicator}>
      <Ionicons name="arrow-forward" size={12} color={colors.textLight} />
    </View>
  )}
  {/* ... existing day rendering */}
</TouchableOpacity>
```

**Statistik-Screen:**

```tsx
<Card>
  <Text style={styles.statLabel}>Trink-Sessions</Text>
  <Text style={styles.statValue}>{stats.totalSessions}</Text>

  <Text style={styles.statLabel}>Davon über Limit</Text>
  <Text style={[
    styles.statValue,
    stats.sessionsOverLimit > 0 && styles.statValueWarning
  ]}>
    {stats.sessionsOverLimit}
  </Text>

  <Text style={styles.statSubtext}>
    Aktive Tage: {stats.activeDays}
  </Text>
  <Text style={styles.statSubtext}>
    Ø {stats.averageDrinksPerSession.toFixed(1)} Einheiten/Session
  </Text>
</Card>
```

---

## Migrations-Strategie

### Phase 1: Daten-Migration (Backend)

1. **Session-Tabelle erstellen** (Schema-Version 3)
2. **Historische Daten migrieren:**
   ```typescript
   async function migrateToSessions() {
     // 1. Lade alle Drinks
     const allDrinks = await getAllDrinkEntries();
     const profile = await getUserProfile();

     // 2. Erkenne Sessions
     const sessions = detectSessions(allDrinks, profile);

     // 3. Speichere Sessions
     for (const session of sessions) {
       await upsertSession(session);
     }
   }
   ```

3. **Backward Compatibility:** Behalte tages-basierte Statistiken parallel für Übergangphase

### Phase 2: UI-Migration (Frontend)

1. **Feature-Flag:** `USE_SESSION_BASED_LIMITS`
   ```typescript
   const useSessionLimits = false;  // Später auf true setzen
   ```

2. **Parallele Implementierung:**
   - Zeige beide Statistiken: "X Tage über Limit" UND "Y Sessions über Limit"
   - Kalender zeigt beide Ansichten (umschaltbar)

3. **User-Feedback:** Beta-Tester testen Session-basiertes System

4. **Vollständige Migration:** Entferne tages-basierte Limits komplett

### Phase 3: Cleanup

1. Entferne Feature-Flag
2. Entferne alte tages-basierte Statistik-Funktionen
3. Aktualisiere Dokumentation

---

## Offene Fragen

### 1. Session-Timeout

**Problem:** Was wenn User vergisst, letzte Drinks einzutragen?

**Lösung:**
- Maximal 18h Session-Dauer (BAC_CONSTANTS.HORIZON_HOURS)
- Danach automatisch als beendet markieren

### 2. Nachträgliches Eintragen

**Problem:** User trägt Drink von gestern ein, Session wurde schon beendet.

**Lösung:**
- Re-calculate alle Sessions ab dem eingefügten Zeitpunkt
- Warnung an User: "Dies wird eine abgeschlossene Session re-öffnen"

### 3. Multi-Day-Sessions > 2 Tage

**Problem:** Session geht über 3+ Tage (z.B. Festival).

**Lösung:**
- Kalender zeigt Pfeil-Kette: `●→ →→ →→`
- Tap auf Folge-Tag öffnet Session-Detail mit allen Tagen
- Statistik zählt nur 1 Session, aber markiert alle betroffenen Tage

### 4. Tages-Limit vs. Session-Limit

**Problem:** Soll es BEIDE Limits geben?

**Option A:** Nur Session-Limits (einfacher)
**Option B:** Beides parallel
  - Session-Limit: Primäre Harm-Reduction-Grenze
  - Tages-Limit: Sekundäre "Erinnerung" (z.B. "max 1 Drink/Tag")

**Empfehlung:** Start mit Option A, User-Feedback abwarten

---

## Vorteile nach Migration

✅ **Harm Reduction optimal:** Sessions sind medizinisch relevante Einheit
✅ **Kein Mitternachts-Problem:** Limits gelten pro Session, nicht pro Tag
✅ **Ehrliche Statistiken:** "2 Sessions über Limit" statt "3 Tage"
✅ **User-Awareness:** User sieht reales Trinkverhalten transparenter

## Nachteile nach Migration

❌ **Komplexität:** Schwieriger zu verstehen für neue User
❌ **Kalender-Darstellung:** Multi-Day-Sessions sind visuell komplex
❌ **Implementierungs-Aufwand:** Große Architektur-Änderung
❌ **Edge Cases:** Viele Spezialfälle (vergessene Einträge, Multi-Day-Sessions, etc.)

---

## Empfehlung

**Warte auf User-Feedback** zu Version 1, bevor Version 4 implementiert wird.

**Kriterien für Migration:**
- [ ] Mindestens 50% der Beta-User berichten vom "Mitternachts-Problem"
- [ ] Statistik-Verzerrung führt zu Verwirrung
- [ ] User fordern explizit Session-basiertes System
- [ ] Team-Kapazität für 2-3 Wochen Entwicklung vorhanden

**Wenn Feedback positiv für Version 1:**
→ Migration auf unbestimmte Zeit verschieben

**Wenn Feedback negativ:**
→ Version 4 implementieren gemäß diesem Plan

---

## Referenzen

- Aktuelle Implementierung: `src/domain/services/statistics.ts`
- BAC-Berechnung: `src/domain/services/bacCalculator.ts`
- Session-Detection (aktuell): `filterDrinksToCurrentSession()` in bacCalculator.ts
- Diskussion: Siehe Konversation vom 2025-12-30 mit User

---

**Ende der Dokumentation**
