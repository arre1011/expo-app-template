# Awards System - Architektur & Konzept

## 1. Fachliches Konzept

### 1.1 Motivation & Ziele

Das Awards-System ist ein zentrales Gamification-Feature der Mindful Drinking App. Es dient dazu, Nutzer zu motivieren, ihre selbst gesetzten Limits einzuhalten, ohne moralisierend zu wirken.

**Kernprinzipien:**
- **Positive Verstärkung**: Erfolge feiern, keine Bestrafung bei Rückschlägen
- **Harm Reduction**: Fokus auf bewussten Konsum, nicht Abstinenz
- **Selbstbestimmung**: Der Nutzer definiert sein eigenes Limit
- **Transparenz**: Fortschritt ist jederzeit sichtbar

### 1.2 Psychologische Grundlagen

Basierend auf Gamification-Forschung (Duolingo, Streaks App, Less App):

| Prinzip | Beschreibung | Anwendung |
|---------|--------------|-----------|
| **Loss Aversion** | Menschen fürchten Verlust mehr als sie Gewinn schätzen | Streak-Anzeige mit "Don't break the chain" |
| **Variable Motivation** | Kleine Streaks fühlen sich relativ größer an | Progress-Anzeige in % bei niedrigen Streaks |
| **Zeigarnik Effect** | Unvollständige Aufgaben bleiben im Gedächtnis | "5 more days to Gold!" Hinweise |
| **Milestone Celebration** | Dopamin-Ausschüttung bei Zielerreichung | Animation/Badge bei neuem Milestone |

**Statistiken aus der Forschung:**
- Nutzer mit 7+ Tage Streaks sind 3.6x wahrscheinlicher langfristig dabei (Duolingo)
- Apps mit Streak + Milestone-Kombination haben 40-60% höhere DAU
- "Streak Freeze" Features reduzieren Churn um ~21%

### 1.3 Award-Kategorien

#### Streak Awards (Konsekutive Erfolge)

| Award | ID | Beschreibung | Milestones |
|-------|-----|--------------|------------|
| **Limit Keeper** | `limit_keeper` | Konsekutive Tage unter dem BAC-Limit | 7, 14, 30, 60, 90, 180, 365 |
| **Mindful Drinker** | `mindful_drinker` | Konsekutive Trinksessions unter dem Limit | 3, 5, 10, 25, 50, 100 |
| **Tracker** | `tracker` | Konsekutive Tage mit App-Nutzung (auch ohne Drinks) | 7, 14, 30, 60 |

#### Milestone Awards (Kumulative Erfolge)

| Award | ID | Beschreibung | Milestones |
|-------|-----|--------------|------------|
| **Sessions Mastered** | `sessions_total` | Gesamtzahl Sessions unter Limit (nicht konsekutiv) | 10, 25, 50, 100, 250, 500 |
| **Perfect Weeks** | `perfect_week` | Anzahl Wochen komplett unter Limit | 4, 12, 26, 52 |
| **Data Collector** | `data_collector` | Gesamtzahl getrackte Tage | 30, 90, 180, 365 |

#### Improvement Awards (Trend-basiert) - Phase 2

| Award | ID | Beschreibung |
|-------|-----|--------------|
| **Trend Setter** | `trend_setter` | Durchschnittlicher Peak-BAC niedriger als Vormonat |
| **Cutting Back** | `cutting_back` | Weniger Drinks pro Session als 30-Tage-Durchschnitt |
| **Recovery Champion** | `recovery_champion` | Längste Zeit zwischen Sessions (7+ Tage) |

### 1.4 Tier-System

Jeder Streak-Award hat Stufen (Tiers):

| Tier | Farbe | Icon | Schwellwert-Beispiel (Limit Keeper) |
|------|-------|------|-------------------------------------|
| **Bronze** | `#CD7F32` | 🥉 | 7 Tage |
| **Silver** | `#C0C0C0` | 🥈 | 14 Tage |
| **Gold** | `#FFD700` | 🥇 | 30 Tage |
| **Platinum** | `#E5E4E2` | 🏅 | 60+ Tage |

---

## 2. UI/UX Konzept

### 2.1 Platzierung (Progressive Disclosure)

Awards werden an mehreren Stellen angezeigt, mit unterschiedlicher Tiefe:

```
┌─────────────────────────────────────────────────────────────────┐
│  CALENDAR TAB (Hauptmotivator)                                  │
│  ├── Kalender-Grid                                              │
│  ├── Legend (Sober/Moderate/Over Limit)                         │
│  └── [NEU] Streak Widget                                        │
│       ├── Aktueller "Under Limit" Streak                        │
│       ├── Progress-Bar zum nächsten Milestone                   │
│       ├── Persönlicher Rekord                                   │
│       └── "See all" Link                                        │
├─────────────────────────────────────────────────────────────────┤
│  STATISTICS TAB (Detailansicht)                                 │
│  ├── Stats Grid (Total, Drinking Days, Dry Days, Peak)          │
│  ├── Chart                                                      │
│  └── [NEU] Awards Section                                       │
│       ├── Active Streaks mit Progress                           │
│       ├── Earned Badges Grid                                    │
│       └── "View All" Button                                     │
├─────────────────────────────────────────────────────────────────┤
│  AWARDS DETAIL MODAL (Vollständige Übersicht)                   │
│  ├── Alle Award-Kategorien                                      │
│  ├── Progress für jeden Award                                   │
│  ├── Erreichte Milestones mit Datum                             │
│  └── Locked Awards (ausgegraut)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Streak Widget (Calendar Tab)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 CURRENT STREAK                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87%                 │
│  35 days under limit              Best: 42 days                 │
│                                                                 │
│  🏆 LATEST ACHIEVEMENT                         [See all →]      │
│  ┌──────┐  "10 Sessions Mastered"                               │
│  │  🍻  │   You stayed under your limit                         │
│  └──────┘   for 10 drinking sessions!                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Celebration Animation

Bei Erreichen eines neuen Milestones:
- Konfetti-Animation (optional)
- Badge erscheint mit Scale-Animation
- Haptic Feedback (light)
- Toast/Modal mit Glückwunsch

---

## 3. Technische Architektur

### 3.1 Architektur-Übersicht

Das Awards-System folgt der bestehenden Schichten-Architektur der App:

```
┌─────────────────────────────────────────────────────────────────┐
│                     EVENTS (Trigger)                            │
│   drinksChanged → sessionsChanged → awardsRecalculate          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AWARDS DOMAIN                                                  │
│                                                                 │
│  ┌─────────────────┐                                           │
│  │ awardDefinitions│  (Konstanten: Milestones, Icons, etc.)    │
│  └─────────────────┘                                           │
│           ↓                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ awardCalculator │→ │  awardService   │→ │ awardRepository│  │
│  │   (Pure Fn)     │  │ (Orchestration) │  │    (DB CRUD)   │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI LAYER                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ useAwardsStore  │  │  AwardsWidget   │  │ AwardsDetail   │  │
│  │   (Zustand)     │  │ (Calendar Tab)  │  │    (Modal)     │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Datei-Struktur

```
src/
├── domain/
│   ├── models/
│   │   └── types.ts                    ← + Award Types
│   ├── services/
│   │   ├── awardCalculator.ts          ← NEU: Reine Berechnungslogik
│   │   └── awardService.ts             ← NEU: Orchestrierung
│   └── constants/
│       └── awardDefinitions.ts         ← NEU: Award-Konfiguration
│
├── data/
│   ├── database/
│   │   └── migrations.ts               ← + Award-Tabellen
│   └── repositories/
│       └── awardRepository.ts          ← NEU: DB-Operationen
│
└── ui/
    ├── hooks/
    │   ├── useAwardsStore.ts           ← NEU: Zustand Store
    │   └── drinkDataEvents.ts          ← + 'awardsChanged' Event
    └── components/
        ├── AwardsWidget.tsx            ← NEU: Streak-Widget für Calendar
        └── AwardsDetailModal.tsx       ← NEU: Vollständige Awards-Ansicht
```

### 3.3 Kernprinzip: Awards als "Abgeleitete Daten"

Analog zur Session-Architektur werden Awards nicht dauerhaft gecached, sondern bei Bedarf neu berechnet:

```
┌─────────────────────────────────────────────────────────────────┐
│  SESSIONS (Single Source of Truth)                              │
│  + DAILY_GOALS                                                  │
└─────────────────────────────────────────────────────────────────┘
                    ↓ (bei jeder Änderung)
┌─────────────────────────────────────────────────────────────────┐
│  awardCalculator.calculateStreaks()                             │
│  → Berechnet alle Streak-Werte aus Session-Daten                │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│  award_progress (DB)                                            │
│  → Speichert nur: best_streak, total_count                      │
│  → current_streak wird IMMER neu berechnet                      │
└─────────────────────────────────────────────────────────────────┘
```

**Was wird persistiert:**
- `best_streak` - Persönlicher Rekord (für Anzeige)
- `total_count` - Kumulative Zählung (für Milestone-Awards)
- `achieved_milestones` - Erreichte Milestones mit Datum

**Was wird berechnet:**
- `current_streak` - Aktueller Streak-Wert
- `progress_percent` - Fortschritt zum nächsten Milestone
- `is_active` - Ob Streak aktiv ist


---

## 4. Datenfluss

### 4.1 Bei Drink-Änderung

```
┌─────────────────────────────────────────────────────────────────┐
│  User fügt Drink hinzu / löscht / bearbeitet                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  useAppStore.addDrink() / removeDrink() / updateDrink()        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  sessionService.recalculateAllSessions()                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  drinkDataEvents.emit('sessionsChanged')                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  useAwardsStore.onSessionsChanged() [Event Listener]            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  awardService.recalculateAllAwards()                            │
│    1. Lade Sessions aus DB                                      │
│    2. Lade DailyGoals aus DB                                    │
│    3. awardCalculator.calculateAwards() [Pure Function]         │
│    4. Vergleiche mit gespeichertem Progress                     │
│    5. Update DB (award_progress, award_milestone)               │
│    6. Prüfe auf neue Milestones                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  drinkDataEvents.emit('awardsChanged') [Optional]               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI aktualisiert sich (AwardsWidget, Statistics Tab)            │
│  + Optional: Celebration Modal für neue Milestones              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Bei App-Start

```
┌─────────────────────────────────────────────────────────────────┐
│  App startet                                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  useAwardsStore.initialize()                                    │
│    1. awardService.recalculateAllAwards()                       │
│    2. Speichere Awards in Store                                 │
│    3. Prüfe auf ungefeierte Milestones                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI zeigt aktuelle Streaks / Celebration für neue Milestones    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementierungs-Plan

### Phase 1: MVP (Empfohlen für ersten Release)

| Schritt | Aufgabe | Dateien | Aufwand |
|---------|---------|---------|---------|
| 1.1 | Award Types in types.ts | `types.ts` | S |
| 1.2 | Award Definitions | `awardDefinitions.ts` | S |
| 1.3 | Award Calculator (nur limit_keeper) | `awardCalculator.ts` | M |
| 1.4 | DB-Schema + Repository | `migrations.ts`, `awardRepository.ts` | M |
| 1.5 | Award Service | `awardService.ts` | M |
| 1.6 | Awards Store (Zustand) | `useAwardsStore.ts` | M |
| 1.7 | Streak Widget (Calendar) | `AwardsWidget.tsx` | M |
| 1.8 | Integration in Calendar Tab | `calendar.tsx` | S |
| 1.9 | Event-Integration | `drinkDataEvents.ts` | S |
| 1.10 | Tests | `awardCalculator.test.ts` | M |

**Scope Phase 1:**
- Nur `limit_keeper` Award
- Streak-Widget unter Kalender
- Keine Celebration-Animation
- Keine Awards-Detail-Ansicht

### Phase 2: Vollständige Awards

| Schritt | Aufgabe |
|---------|---------|
| 2.1 | Alle Award-Typen implementieren |
| 2.2 | Awards-Section in Statistics Tab |
| 2.3 | Awards-Detail-Modal |
| 2.4 | Celebration Animation bei neuem Milestone |

### Phase 3: Erweiterungen

| Schritt | Aufgabe |
|---------|---------|
| 3.1 | Improvement Awards (Trend-basiert) |
| 3.2 | Streak Freeze Feature |
| 3.3 | Social Sharing (Badge teilen) |

---

## 6. Test-Strategie

### Unit Tests (Pflicht)

```typescript
// __tests__/awardCalculator.test.ts

describe('awardCalculator', () => {
  describe('calculateLimitKeeperStreak', () => {
    it('should count consecutive days under limit', () => {
      // ...
    });

    it('should reset streak when limit exceeded', () => {
      // ...
    });

    it('should treat days without goal as under limit', () => {
      // ...
    });

    it('should handle sober days correctly', () => {
      // ...
    });
  });

  describe('calculateMindfulDrinkerStreak', () => {
    it('should count consecutive sessions under limit', () => {
      // ...
    });
  });

  describe('isSessionUnderLimit', () => {
    it('should return true when no goal is set', () => {
      // ...
    });

    it('should return true when BAC equals limit exactly', () => {
      // ...
    });

    it('should return false when BAC exceeds limit', () => {
      // ...
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/awardsIntegration.test.ts

describe('Awards Integration', () => {
  it('should update streak when drink is added', () => {
    // ...
  });

  it('should create milestone when threshold reached', () => {
    // ...
  });

  it('should persist best streak even after reset', () => {
    // ...
  });
});
```

---

## 9. Offene Fragen / Entscheidungen

| Frage | Empfehlung | Status |
|-------|------------|--------|
| Soll "kein Limit gesetzt" als "unter Limit" zählen? | Ja (Harm Reduction) | ✅ Entschieden -> man kann kein kein limit auswählen, es gibt immer ien Limit. aber der user kann es sehr hoch machen wenn er möchte  |
| Sollen sober days zum Streak zählen? | Ja | ✅ Entschieden Wir könne ja einemal machen wie viele Tag man das limit nicht mehr überschritten aht und dann aber auch noch wie oft nicht wenn man getrunken hat|
| Streak Freeze Feature? | Phase 3 | ⏳ Später |
| Celebration Animation? | Phase 2 | ⏳ Später |
| Awards in Statistics oder eigener Tab? | Statistics Tab | ✅ Entschieden |

---

*Letzte Aktualisierung: 5. Februar 2026*
