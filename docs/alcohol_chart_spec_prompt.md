# Spezifikation: Alkoholkonsum-Statistik als Balkendiagramm (Apple-Health-ähnlich)

## Ziel
Implementiere eine Statistik-Ansicht, die den historischen Alkoholkonsum als **Balkendiagramm** zeigt – visuell und in der Bedienung **analog zur Apple-Health-Ansicht** (z. B. „Active Energy“), jedoch mit folgenden Zeiträumen:
- **Weekly (Woche)**
- **Month (Monat)**
- **Six-Month (6 Monate)**
- **Year (Jahr)**  
**Daily wird nicht angeboten.**

Der Chart soll so gestaltet sein, dass Nutzer:innen schnell Muster erkennen (z. B. „am Wochenende mehr“) und durch Wischen/Navigation in die Vergangenheit gehen können.

---

## Datenquelle und Berechnungsprinzip

### Persistenz (SQLite)
- Alle Konsumdaten liegen in einer **lokalen SQLite-Datenbank**.
- Die Speicherung erfolgt **tagbasiert** (d. h. jeder Eintrag ist einem Datum zugeordnet; es kann mehrere Einträge pro Datum geben).
- Wichtig: Es gibt **keine** in der DB gespeicherten voraggregierten Werte für Woche/Monat/6 Monate/Jahr.

### On-the-fly-Berechnung (Instant Calculation)
- Beim Öffnen der Statistik und **jedem Wechsel des Zeitraums oder der Periode** werden:
  1) Zeitraum (Start/Ende) berechnet
  2) Rohdaten aus SQLite **für genau diesen Zeitraum** geladen
  3) Werte in eine **vergleichbare Standardeinheit** umgerechnet
  4) in Zeit-Buckets (Bars) aggregiert
  5) an den Chart gebunden/gerendert  

---

## Standardeinheit (Vergleichbarkeit statt „Anzahl Getränke“)

### Motivation
Die Visualisierung darf **nicht** die reine Anzahl „Getränke“ anzeigen, weil unterschiedliche Getränke sehr unterschiedliche Alkoholmengen enthalten (z. B. Shot vs. Maß).  
Stattdessen muss alles auf eine **einheitliche Standard-Alkoholeinheit** heruntergerechnet werden.

### Definition
- Interner Basiswert: **Gramm reiner Alkohol** pro Eintrag.
- Daraus abgeleitet: **Standard Units (SU)** mit frei definierbarer Umrechnungsbasis.

**Berechnung pro Eintrag:**
- `alkohol_g = volumen_ml × (abv_prozent / 100) × 0,789`
  - `0,789` = angenäherte Dichte von Ethanol in g/ml (Konstante).
- `su = alkohol_g / gram_pro_standard_unit`
- Die Infromtion der berechnung soll dem User auch bereitgestellt werden. Am besten irgendwo in der nähe von der Y achse soll ein infortmaitons i sein, wenn dieses geklickt wird, wird beschrieben wie die Y achse berechnet wird auf die Standereihat mit formel und auch warum es gemacht wird beispiel shot und Bier ist vielelicht ein gutes beispiel heirfür. Falls du aus UX/UI sicht einen besseren ansatz hast auch gerne diesen 


---

## UI/UX: Navigation und Zeitbereiche

### Zeitbereich-Auswahl (Segmented Control)
Oben befindet sich eine Umschaltleiste mit:
- **W** (Weekly)
- **M** (Month)
- **6M** (Six-Month)
- **Y** (Year)

### Perioden-Navigation
- Nutzer:innen können innerhalb eines gewählten Zeitbereichs in die Vergangenheit wechseln (z. B. vorige Woche, voriger Monat).
- Navigation kann über **Wischen (horizontal)** oder Pfeile erfolgen.
- Beim Wechsel der Periode wird die Aggregation **neu** aus der SQLite-Datenbank berechnet (siehe On-the-fly).

### Kalenderlogik (Wichtig)
- **Wochenstart ist Montag**, Woche läuft **Mo–So** (für Buckets und X-Achse).

---

## Chart-Spezifikation je Zeitbereich

### 1) Weekly (Woche)
- **Periode:** eine Kalenderwoche (Mo–So).
- **Bars:** exakt **7** Balken, einer pro Wochentag.
- **Bucket:** Summe der `su` pro Datum.
- **X-Achse Labels:** „Mo, Di, Mi, Do, Fr, Sa, So“.
- **Y-Achse:** Standard Units (SU), Baseline = 0.

### 2) Month (Monat)
- **Periode:** ein Kalendermonat.
- **Bars:** **ein Balken pro Tag** des Monats (28–31).
- **Bucket:** Summe der `su` pro Datum.
- **X-Achse Labels (Tick-Strategie wie Apple Health):**
  - Nicht jeder Tag wird beschriftet.
  - Es werden die **Montage innerhalb des Monats** als Ticks gezeigt (Starttage der Wochen).
  - Beispiel-Logik: erste sichtbare Tickzahl = erster Montag im Monat, dann +7 Tage.
  - Beispiel **Oktober 2025**: **6, 13, 20, 27** (jeweils Montage).
- **Y-Achse:** Standard Units (SU), Baseline = 0.

### 3) Six-Month (6 Monate)
- **Periode:** die letzten **6 Monate** rückwärts ab „Enddatum“ (typisch: heute) oder eine durch Navigation gewählte Endperiode.
- **Bars:** **ein Balken pro Kalenderwoche** (Mo–So) im 6‑Monatsfenster.
- **Bucket:** Summe der `su` in dieser Kalenderwoche.
- **X-Achse Labels:** Monatspunkte/Monatskürzel nach Bedarf (gerne sparsam, wie Apple Health).  
  (Wichtig ist: jede Bar = Woche, nicht Tag.)

### 4) Year (Jahr)
- **Periode:** ein Kalenderjahr.
- **Bars:** **12** Balken, einer pro Monat.
- **Bucket:** Summe der `su` pro Monat.
- **X-Achse Labels:** Monats-Kürzel als **ein Buchstabe**:
  - J, F, M, A, M, J, J, A, S, O, N, D  
  (oder lokalisiert, aber identisches Prinzip: sehr kurze Labels)
- **Y-Achse:** Standard Units (SU), Baseline = 0.

---

## Interaktion im Chart
- **Tap auf Balken** zeigt eine Detailanzeige (Tooltip/Bottom Sheet):
  - Zeitraum des Balkens (Datum oder Wochenrange oder Monat)
  - Wert in **SU** (optional zusätzlich: g reiner Alkohol)
- Optional: Balken bei Tap **highlighten** (visueller Fokus).
- **0‑Werte:** Tage/Wochen ohne Konsum werden als Balken mit Höhe 0 angezeigt (keine Lücken).

---

## Styling-Vorgaben (bewusst minimal, aber festgelegt)
- Balken sind **rechteckig**, ohne 3D-Effekte.
- **Gemeinsame Null-Baseline** (Y-Achse startet bei 0), keine abgeschnittene Achse.

---

## Beispiele (zur Validierung)

### Weekly – „letzte Woche“
- Nutzer wählt „W“ und navigiert auf die Vorwoche.
- App lädt alle Einträge aus SQLite im Range **Mo–So** dieser Woche.
- Rechnet jeden Eintrag in SU um, summiert pro Tag → 7 Balken.

### Month – Oktober 2025
- Nutzer wählt „M“ und navigiert zu Oktober 2025.
- Bars: 31 (für 1–31).
- X-Achse zeigt Ticks: **6, 13, 20, 27** (Montage im Monat).

### Year – 2025
- Nutzer wählt „Y“ und Jahr 2025.
- Bars: 12 (Jan–Dez), Labels: J F M A M J J A S O N D.
