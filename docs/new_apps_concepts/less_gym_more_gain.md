# Less Gym, More Gain - App Concept & Screen Design

## App Narrativ

**"Less Gym, More Gain"** - Konsistenz schlaegt Volumen. Die Wissenschaft zeigt:
die wichtigste Variable fuer Muskelaufbau ist **regelmaessiges Training**, nicht
die Dauer oder Komplexitaet einzelner Sessions.

**Das Modell:** 2x taeglich (morgens + abends), je 5-10 Minuten, 1 Satz pro
Muskelgruppe, 5 Tage/Woche = **10 Saetze pro Muskelgruppe/Woche** - wissenschaftlich
ausreichend fuer Hypertrophie (Schoenfeld et al., 2017).

---

## Forschungsergebnis: Fortschritt auf dem Homescreen zeigen

### Ist es der richtige Ansatz, den User emotional mit seinem Fortschritt zu konfrontieren?

**Ja - eindeutig.** Die Forschung stuetzt diesen Ansatz aus mehreren Richtungen:

#### Psychologische Mechanismen

| Mechanismus | Effekt | Quelle |
|---|---|---|
| **Dopamin-Ausschuettung** | Wahrgenommener Fortschritt loest Dopamin aus und verstaerkt das Verhalten | Moldstud - Psychology of App Engagement |
| **Zeigarnik-Effekt** | Unvollstaendige Fortschrittsbalken erzeugen kognitive Spannung, die User zurueck in die App zieht | UX Bulletin, UX Collective |
| **Goal-Gradient-Effekt** | Je naeher am Ziel, desto staerker die Motivation - ein Balken bei 70% motiviert mehr als bei 10% | UX Collective - Endowed Progress |
| **Progress Principle (Amabile)** | Aus 12.000 Tagebucheintraegen: Sichtbarer Fortschritt ist der staerkste Motivationsfaktor - staerker als Anerkennung oder Belohnungen | Harvard Business School, HBR |
| **Endowed Progress Effect** | User mit "Vorsprung" (vorausgefuellter Balken) haben 34% hoehere Abschlussrate vs. 19% bei Null-Start | Nunes & Dreze, 2006 |

#### Belegt durch erfolgreiche Apps

- **Duolingo:** Streak-Anzeige direkt auf dem Homescreen steigert Engagement um 60%
- **Apple Fitness Rings:** 80% der Nutzer halten erhoehte Aktivitaet ueber Wochen bei
- **Nike Training Club:** Jeder App-Start zeigt eine positive emotionale Bestaetigung

#### Metriken

- **+39%** hoehere Abschlussraten bei sichtbarem Fortschritt
- **+45%** Retention durch personalisiertes Progress-Tracking
- **-35%** 30-Tage-Churn bei gamifizierten Progress-Elementen

#### Risiken & Gegenmassnahmen

| Risiko | Gegenmassnahme |
|---|---|
| Streak-Verlust demotiviert | "Streak Freeze" oder Consistency-Score statt harter Streaks |
| Leerer Zustand bei neuen Usern | "Endowed Start" - Welcome-Milestone, Vorschau wie Progress aussehen wird |
| Verfehlte Ziele loesen Scham aus | Empathische Sprache: "Almost there - keep going!" statt "Failed" |
| Vergleich mit anderen demotiviert | Nur Vergleich mit eigenem Fortschritt, nie mit anderen Usern |

**Fazit:** Fortschritt prominent auf dem Homescreen zeigen ist der richtige Ansatz.
Entscheidend ist die positive Rahmung - Fortschritt feiern, nicht Versagen hervorheben.

---

## Muskelgruppen

| ID | Name | Deutsch |
|---|---|---|
| chest | Chest | Brust |
| back | Back | Ruecken |
| quads | Quads | Quadrizeps |
| hamstrings | Hamstrings | Beinbeuger |
| abs | Abs | Bauchmuskeln |
| side_delt | Side Delt | Seitliche Schulter |
| bicep | Bicep | Bizeps |
| tricep | Tricep | Trizeps |
| rear_delt | Rear Delt | Hintere Schulter |
| front_delt | Front Delt | Vordere Schulter |
| calves | Calves | Waden |

---

## Screen 1: Progress (Homescreen / Tab "Progress")

### Beschreibung

Der Homescreen zeigt alle Muskelgruppen als Cards. Jede Card zeigt den
woechentlichen Fortschritt auf einen Blick. Ziel: Der User sieht sofort,
wo er steht - positive emotionale Konfrontation mit seinem Fortschritt.

### ASCII Mockup

```
+--------------------------------------------------+
|  Status Bar                            9:41 AM    |
+--------------------------------------------------+
|                                                    |
|  Less Gym, More Gain              Week 12  🔥 23  |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  +----------------------------------------------+ |
|  | Chest                                      >  | |
|  | [████████████░░░░░░░░]              8/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Back                                       >  | |
|  | [██████████████████░░]              9/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Quads                                      >  | |
|  | [████████████████████]             10/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Hamstrings                                 >  | |
|  | [██████░░░░░░░░░░░░░░]              3/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Abs                                        >  | |
|  | [████████████░░░░░░░░]              6/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Side Delt                                  >  | |
|  | [████████░░░░░░░░░░░░]              4/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Bicep                                      >  | |
|  | [██████████████░░░░░░]              7/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Tricep                                     >  | |
|  | [██████████████░░░░░░]              7/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Rear Delt                                  >  | |
|  | [████████████░░░░░░░░]              6/15      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Front Delt                                 >  | |
|  | [██████████░░░░░░░░░░]              5/10      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  | Calves                                     >  | |
|  | [████░░░░░░░░░░░░░░░░]              2/10      | |
|  +----------------------------------------------+ |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   [Progress]       [Workout]       [Settings]     |
|      (*)              ( )             ( )          |
+--------------------------------------------------+
```

### Card Detail (Tap auf ">")

Oeffnet ein Bottom Sheet Modal zur Konfiguration der Muskelgruppe:

```
+--------------------------------------------------+
|                                                    |
|  ━━━━━━━━━━  (Drag Handle)                        |
|                                                    |
|  [X]           Edit Chest                  [Save]  |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  Weekly Set Goal                                   |
|                                                    |
|  +----------------------------------------------+ |
|  |                                                | |
|  |   [-]              15              [+]         | |
|  |                                                | |
|  +----------------------------------------------+ |
|                                                    |
|  Current Progress                                  |
|  [████████████████████████░░░░░░░░]  8/15          |
|                                                    |
|  This week's sets:                                 |
|  Mon: 2  |  Tue: 2  |  Wed: 2  |  Thu: 2          |
|  Fri: -  |  Sat: -  |  Sun: -                      |
|                                                    |
+--------------------------------------------------+
```

---

## Screen 2: Workout (Tab "Workout")

### Beschreibung

Der Workout-Screen ist der Startpunkt fuer das Training. Der User kann
ein leeres Workout starten und Saetze hinzufuegen. In V2+ kommen Templates.

### ASCII Mockup - Workout Start

```
+--------------------------------------------------+
|  Status Bar                            9:41 AM    |
+--------------------------------------------------+
|                                                    |
|  Start Workout                                     |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  Quickstart                                        |
|                                                    |
|  +----------------------------------------------+ |
|  |                                                | |
|  |          Start Empty Workout                   | |
|  |                                                | |
|  +----------------------------------------------+ |
|                                                    |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|                                                    |
|  Templates                          (V2+)    [+]  |
|                                                    |
|  +----------------------------------------------+ |
|  |  Full Body Workout                             | |
|  |  Chest, Back, Quads, Abs          ~10 min      | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  |  Upper Body                                    | |
|  |  Chest, Back, Bicep, Tricep       ~8 min       | |
|  +----------------------------------------------+ |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   [Progress]       [Workout]       [Settings]     |
|      ( )              (*)             ( )          |
+--------------------------------------------------+
```

### ASCII Mockup - Active Workout (nach "Start Empty Workout")

```
+--------------------------------------------------+
|  Status Bar                            9:41 AM    |
+--------------------------------------------------+
|                                                    |
|  Active Workout                  Duration: 03:24   |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  +----------------------------------------------+ |
|  |                                                | |
|  |              + Add Set                         | |
|  |                                                | |
|  +----------------------------------------------+ |
|                                                    |
|  Recent Sets                                       |
|                                                    |
|  +----------------------------------------------+ |
|  |  [+]  Bench Press (Chest)         12 reps     | |
|  +----------------------------------------------+ |
|  |  [+]  Pull-ups (Back)             8 reps      | |
|  +----------------------------------------------+ |
|  |  [+]  Squats (Quads)              15 reps     | |
|  +----------------------------------------------+ |
|  |  [+]  Dumbbell Curl (Bicep)       10 reps     | |
|  +----------------------------------------------+ |
|  |  [+]  Tricep Dips (Tricep)        12 reps     | |
|  +----------------------------------------------+ |
|                                                    |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|                                                    |
|  This Workout                                      |
|  (Sets werden hier angezeigt sobald hinzugefuegt)  |
|                                                    |
|  +----------------------------------------------+ |
|  |                                                | |
|  |            Finish Workout                      | |
|  |                                                | |
|  +----------------------------------------------+ |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   [Progress]       [Workout]       [Settings]     |
|      ( )              (*)             ( )          |
+--------------------------------------------------+
```

### ASCII Mockup - Active Workout (mit Saetzen)

```
+--------------------------------------------------+
|  Status Bar                            9:41 AM    |
+--------------------------------------------------+
|                                                    |
|  Active Workout                  Duration: 05:12   |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  +----------------------------------------------+ |
|  |              + Add Set                         | |
|  +----------------------------------------------+ |
|                                                    |
|  Recent Sets                                       |
|                                                    |
|  +----------------------------------------------+ |
|  |  [+]  Bench Press (Chest)         12 reps     | |
|  +----------------------------------------------+ |
|  |  [+]  Pull-ups (Back)             8 reps      | |
|  +----------------------------------------------+ |
|  |  [+]  Squats (Quads)              15 reps     | |
|  +----------------------------------------------+ |
|                                                    |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|                                                    |
|  This Workout (3 sets)                             |
|                                                    |
|  +----------------------------------------------+ |
|  |  [check]  Bench Press             12 reps     | |
|  |           Chest                    Bodyweight  | |
|  +----------------------------------------------+ |
|  |  [check]  Pull-ups                8 reps      | |
|  |           Back                     Bodyweight  | |
|  +----------------------------------------------+ |
|  |  [check]  Squats                  15 reps     | |
|  |           Quads                    Bodyweight  | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------------------------------------------+ |
|  |                                                | |
|  |            Finish Workout                      | |
|  |                                                | |
|  +----------------------------------------------+ |
|                                                    |
+--------------------------------------------------+
```

### ASCII Mockup - Add Set Modal (Bottom Sheet)

```
+--------------------------------------------------+
|                                                    |
|  ━━━━━━━━━━  (Drag Handle)                        |
|                                                    |
|  [X]          Add Set                              |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  +----------------------------------------------+ |
|  |  Search exercises...                     [Q]  | |
|  +----------------------------------------------+ |
|                                                    |
|  All Exercises                                     |
|                                                    |
|  CHEST                                             |
|  +----------------------------------------------+ |
|  |  Bench Press                                   | |
|  +----------------------------------------------+ |
|  |  Push-ups                                      | |
|  +----------------------------------------------+ |
|  |  Dumbbell Fly                                  | |
|  +----------------------------------------------+ |
|                                                    |
|  BACK                                              |
|  +----------------------------------------------+ |
|  |  Pull-ups                                      | |
|  +----------------------------------------------+ |
|  |  Dumbbell Row                                  | |
|  +----------------------------------------------+ |
|  |  Superman                                      | |
|  +----------------------------------------------+ |
|                                                    |
|  QUADS                                             |
|  +----------------------------------------------+ |
|  |  Squats                                        | |
|  +----------------------------------------------+ |
|  |  Lunges                                        | |
|  +----------------------------------------------+ |
|  |  Wall Sit                                      | |
|  +----------------------------------------------+ |
|                                                    |
|  ... (weitere Muskelgruppen)                       |
|                                                    |
+--------------------------------------------------+
```

---

## Screen 3: Settings

### ASCII Mockup

```
+--------------------------------------------------+
|  Status Bar                            9:41 AM    |
+--------------------------------------------------+
|                                                    |
|  Settings                                          |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  PROFILE                                           |
|  +----------------------------------------------+ |
|  |  Name                              Max    >   | |
|  +----------------------------------------------+ |
|  |  Weight                           75 kg   >   | |
|  +----------------------------------------------+ |
|  |  Fitness Level                Intermediate >   | |
|  +----------------------------------------------+ |
|                                                    |
|  PREFERENCES                                       |
|  +----------------------------------------------+ |
|  |  Weight Unit                        kg    >   | |
|  +----------------------------------------------+ |
|  |  Week Starts On                    Mon    >   | |
|  +----------------------------------------------+ |
|                                                    |
|  GOALS                                             |
|  +----------------------------------------------+ |
|  |  Default Weekly Set Goal            10    >   | |
|  +----------------------------------------------+ |
|  |  Training Days per Week              5    >   | |
|  +----------------------------------------------+ |
|                                                    |
|  NOTIFICATIONS                         (V2+)      |
|  +----------------------------------------------+ |
|  |  Morning Reminder                  Off    >   | |
|  +----------------------------------------------+ |
|  |  Evening Reminder                  Off    >   | |
|  +----------------------------------------------+ |
|                                                    |
|  DATA                                              |
|  +----------------------------------------------+ |
|  |  Export Data                               >   | |
|  +----------------------------------------------+ |
|  |  Reset All Data                            >   | |
|  +----------------------------------------------+ |
|                                                    |
|  ABOUT                                             |
|  +----------------------------------------------+ |
|  |  Version                          1.0.0       | |
|  +----------------------------------------------+ |
|  |  Privacy Policy                           >   | |
|  +----------------------------------------------+ |
|  |  Terms of Service                         >   | |
|  +----------------------------------------------+ |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   [Progress]       [Workout]       [Settings]     |
|      ( )              ( )             (*)          |
+--------------------------------------------------+
```

---

## Navigation (Bottom Tabs)

```
+--------------------------------------------------+
|   [Progress]       [Workout]       [Settings]     |
|    Chart-Icon     Dumbbell-Icon     Gear-Icon     |
+--------------------------------------------------+
```

| Tab | Icon | Beschreibung |
|---|---|---|
| Progress | Chart/Bar-Icon | Homescreen mit Muskelgruppen-Cards |
| Workout | Dumbbell-Icon | Workout starten und Saetze loggen |
| Settings | Gear-Icon | Profil, Einstellungen, Daten |

---

## User Flow: Schnelles Workout loggen

```
                    App oeffnen
                        |
                        v
              Progress Screen sehen
             (emotionale Konfrontation
              mit aktuellem Fortschritt)
                        |
                        v
               Tab "Workout" tippen
                        |
                        v
            "Start Empty Workout" tippen
                        |
                        v
         +------ Recent Sets sehen ------+
         |                                |
         v                                v
   Bekannte Uebung              Neue Uebung noetig
   aus Recent Sets               "Add Set" tippen
   tippen [+]                          |
         |                              v
         |                    Uebung aus Liste
         |                    auswaehlen
         |                          |
         v                          v
       Satz wird dem Workout hinzugefuegt
       (1 Tap = 1 Satz erledigt)
                        |
                        v
            Weitere Saetze hinzufuegen?
              Ja -> zurueck nach oben
              Nein -> "Finish Workout"
                        |
                        v
              Celebration Animation
              Streak + Progress Update
                        |
                        v
              Zurueck zum Progress Screen
              (aktualisierte Fortschrittsbalken)
```

**Zeitaufwand:** 3-5 Taps fuer ein komplettes Workout mit Recent Sets.

---

## Datenmodell (MVP)

```
UserProfile
  - id: string (PK)
  - name: string
  - weightKg: number
  - fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  - weightUnit: 'kg' | 'lb'
  - weekStartDay: 'mon' | 'sun'
  - defaultWeeklySetGoal: number (default: 10)
  - createdAt: timestamp
  - updatedAt: timestamp

MuscleGroup
  - id: string (PK)
  - name: string              // 'chest', 'back', 'quads', etc.
  - displayName: string       // 'Chest', 'Back', 'Quads', etc.
  - weeklySetGoal: number     // individuell konfigurierbar, default: 10
  - sortOrder: number

Exercise
  - id: string (PK)
  - name: string              // 'Push-ups', 'Bench Press'
  - muscleGroupId: string (FK -> MuscleGroup)
  - equipment: 'none' | 'dumbbell' | 'barbell' | 'band' | 'machine'
  - description: string
  - isDefault: boolean        // vorinstalliert vs. user-erstellt
  - sortOrder: number

WorkoutSession
  - id: string (PK)
  - startedAt: timestamp
  - completedAt: timestamp (nullable)
  - durationSeconds: number (computed)
  - totalSets: number (computed)

CompletedSet
  - id: string (PK)
  - sessionId: string (FK -> WorkoutSession)
  - exerciseId: string (FK -> Exercise)
  - reps: number
  - weightKg: number (0 fuer Bodyweight)
  - completedAt: timestamp
  - notes: string (nullable)

--- Computed (nicht gespeichert, berechnet aus CompletedSet) ---
WeeklyVolume:    COUNT(CompletedSet) WHERE exercise.muscleGroupId = X
                 AND completedAt BETWEEN weekStart AND weekEnd
CurrentStreak:   Aufeinanderfolgende Tage mit >= 1 CompletedSet
RecentSets:      Letzte N CompletedSets fuer Quick-Add auf Workout Screen
```

### ER-Diagramm (vereinfacht)

```
UserProfile (1)
     |
     | hat viele
     v
MuscleGroup (11) ----< Exercise (viele)
     |                       |
     |                       | referenziert
     |                       v
     |               CompletedSet (viele)
     |                       |
     |                       | gehoert zu
     |                       v
     |               WorkoutSession (viele)
     |
     +-- weeklySetGoal (konfigurierbar per Card)
```

---

## Erweiterbarkeit (V2+)

| Feature | Wie das Modell es unterstuetzt |
|---|---|
| Workout Templates | Neue `WorkoutTemplate` Tabelle mit Exercise-Referenzen |
| Mehrere Saetze/Uebung | Bereits nativ: mehrere CompletedSet-Zeilen |
| Progressive Overload | CompletedSet-History abfragen, Steigerung vorschlagen |
| Gewichtstracking | weightKg in CompletedSet bereits vorhanden |
| Cloud Sync | CompletedSet-Zeilen push/pull |
| Apple Health | CompletedSets als Workouts exportieren |
| Notifications | ScheduledReminder Tabelle |
| Social/Challenges | Subscription + Cloud noetig |

---

## Quellen (Recherche)

### Psychologie & Progress-Visualisierung
- [HBR - The Power of Small Wins (Amabile)](https://hbr.org/2011/05/the-power-of-small-wins)
- [Harvard Business School - The Progress Principle](https://www.hbs.edu/faculty/Pages/item.aspx?num=40692)
- [UX Collective - Endowed Progress Effect](https://uxdesign.cc/endowed-progress-effect-give-your-users-a-head-start-97d52d8b0396)
- [UX Bulletin - Zeigarnik Effect in UX](https://www.ux-bulletin.com/zeigarnik-effect-ux/)
- [Moldstud - Psychology of App Engagement](https://moldstud.com/articles/p-the-psychology-of-mobile-app-engagement-designing-for-user-motivation)

### App-Analysen & Gamification
- [Duolingo Blog - How the Streak Builds Habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)
- [Beyond Nudge - Psychology Behind Apple Watch](https://www.beyondnudge.org/post/casestudy-apple-watch)
- [Trophy - Designing Streaks for Long-Term Growth](https://trophy.so/blog/designing-streaks-for-long-term-user-growth)
- [Smashing Magazine - Designing a Streak System](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/)

### Fitness App UX & Design
- [Stormotion - Fitness App UI Design Principles](https://stormotion.io/blog/fitness-app-ux/)
- [Eastern Peak - Fitness App Design Best Practices](https://easternpeak.com/blog/fitness-app-design-best-practices/)
- [Zfort - Fitness App UX/UI Best Practices](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention/)

### Datenmodell & Architektur
- [Back4App - Database Schema for Fitness Tracking](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-a-fitness-tracking-application)
- [Dittofi - Data Model for Workout Tracking App](https://www.dittofi.com/learn/how-to-design-a-data-model-for-a-workout-tracking-app)
- [Hevy - Track Workouts Feature](https://www.hevyapp.com/features/track-workouts/)

### Wissenschaftliche Grundlagen
- [Schoenfeld et al. - Dose-Response Volume and Hypertrophy (PubMed)](https://pubmed.ncbi.nlm.nih.gov/27433992/)
- [PMC - Resistance Exercise Minimal Dose Strategies](https://pmc.ncbi.nlm.nih.gov/articles/PMC11127831/)
- [Springer Nature - Minimalist Training Narrative Review](https://link.springer.com/article/10.1007/s40279-023-01949-3)

### Risiken & Gegenmassnahmen
- [Trophy - What Happens When Users Lose Their Streaks](https://trophy.so/blog/what-happens-when-users-lose-streaks)
- [Nozomi Health - Streaks Don't Work](https://nozomihealth.com/streaks-dont-work-how-to-prevent-users-from-breaking-streaks-in-digital-health-apps/)
- [Klarity Health - Streak Features Fail ADHD Users](https://www.helloklarity.com/post/breaking-the-chain-why-streak-features-fail-adhd-users-and-how-to-design-better-alternatives/)
