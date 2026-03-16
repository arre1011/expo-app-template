Du bist ein Software-Builder. Implementiere eine Anwendung als MVP, die alkoholische Getränke trackt und daraus einen **geschätzten Promillewert (BAC in ‰)** über die Zeit berechnet. Die App dient **Harm-Reduction** (bewusster trinken, Limits unterstützen). **Keine** Aussagen oder UI dürfen suggerieren, dass man damit Fahr-/Sicherheitsentscheidungen treffen kann.

### 1) Ziel & Umfang (MVP)

Die App muss:

1. Nutzerprofil erfassen (für BAC-Schätzung).
2. Getränke erfassen (schnell, alltagsnah).
3. Aktuellen geschätzten BAC anzeigen.
4. BAC-Verlauf als Kurve anzeigen inkl. “voraussichtlich nüchtern um …”.
5. Tages-/Session-Limit (z. B. max. 3 Drinks) unterstützen inkl. “Stop-Moment” beim Erreichen/Überschreiten.
6. Historie in Kalenderform und Tagesdetails anzeigen.
7. Einfache Statistik (Woche/Monat) anzeigen.
8. Optional: sanfte Erinnerungen (Opt-in), aber nur wenn es ohne großen Aufwand möglich ist.

Nicht Teil des MVP:

* Kein Social/Community, kein Coaching, keine Cloud-Accounts, keine Zahlungsfeatures.
* Keine medizinischen Diagnosen oder “du bist abhängig”-Label.
* Kein “du darfst fahren”-Signal.

### 2) Fachliche Grundprinzipien

* Alle BAC-Werte sind **Schätzwerte** und müssen als solche markiert sein (“Schätzung”).
* Die App bleibt **nicht wertend** (“non-judgemental”), keine beschämenden Texte.
* Ziel ist **bewusstes Trinken**: Nudges, Reflexion, Transparenz, aber kein Druck.

### 3) Datenmodell (fachlich)

Speichere mindestens:

**UserProfile**

* `weightKg` (Pflicht, Zahl > 0)
* `sex` ODER `bodyWaterConstantR` (Pflicht: entweder Auswahl sex oder direkter r-Wert)
* `eliminationRatePermillePerHour` (Default gesetzt, editierbar)
* `createdAt`, `updatedAt`

**DrinkEntry**

* `id`
* `timestamp` (Datum+Uhrzeit)
* `type` (Preset-Typ oder “custom”)
* `volumeMl` (Pflicht > 0)
* `abvPercent` (Pflicht 0 < … ≤ 100)
* `label` (optional, z. B. “IPA”, “Aperol”)
* `notes` (optional)
* `createdAt`, `updatedAt`

**DailyGoal** (oder Goal pro Session/Tag)

* `date` (Kalendertag)
* `maxDrinks` (z. B. 3)
* optional: `bacThresholdPermille` (wenn du auch Promillelimit anbieten willst; im MVP reicht Drinks-Limit)
* `enabled` (boolean)

Ableitungen (nicht speichern, sondern berechnen):

* “Standarddrinks/Units”, Tages-Summen, Peak-BAC, Kurve.

### 4) Screens / Funktionen (fachlich)

#### 4.1 Onboarding / Profil

* Beim ersten Start: Profil anlegen.
* Pflichtfelder erzwingen.
* Hinweistext: “BAC ist Schätzung, nicht für Fahrentscheidung”.
* In Settings jederzeit editierbar.

#### 4.2 Home / “Heute”

Zeige:

* Aktueller BAC (‰), groß, mit Label “Schätzung”.
* “Voraussichtlich nüchtern um HH:MM” (oder “unter 0,0‰”).
* Fortschritt zum Tagesziel (z. B. 2/3 Getränke).
* BAC-Kurve über Zeit: von Sessionstart bis Zukunft (z. B. nächste 12–18h).
* Liste der heutigen Drinks (chronologisch), editier-/löschbar.

Aktionen:

* “+ Getränk hinzufügen” (primär)
* “Ziel für heute setzen/ändern”
* Zugriff auf Kalender/Statistik/Settings

#### 4.3 Getränk hinzufügen (schnell)

* Presets anbieten (Bier, Wein, Shot, Longdrink) mit typischen Größen.
* “Custom”: Eingabe volumeMl und abvPercent, optional Name.
* Timestamp standardmäßig “jetzt”, aber editierbar (“vor X Minuten” oder Uhrzeit).
* Nach dem Speichern: sofortige Neu-Berechnung von BAC und Kurve.

#### 4.4 Ziel & Nudges (weniger trinken)

* Nutzer:in kann für “heute” ein Ziel setzen: `maxDrinks`.
* Wenn ein Drink eingetragen wird und damit das Limit…

    * **erreicht** wird: zeige ein “Stop-Moment” (Modal/Sheet):

        * Textvorschläge (neutral, hilfreich):

            * “Du hast dein Ziel erreicht. Wie wär’s mit Wasser oder einer Pause?”
            * “Du wolltest heute bei {max} bleiben. Du bist jetzt dort.”
        * Buttons: “OK”, “Ziel anpassen”, optional “Wasser-Reminder”
    * **überschritten** wird: stärkerer (aber weiterhin nicht wertender) Hinweis:

        * “Du bist über deinem Ziel. Eine Pause kann helfen – du musst nichts beweisen.”
        * Buttons: “Trotzdem eintragen”, “Abbrechen”, “Ziel anpassen”
* Kein Pop-up beim bloßen Öffnen der App, nur als Reaktion auf eine konkrete Handlung.

#### 4.5 Kalender / Historie

* Monatskalender mit Tagesindikatoren:

    * trocken (0 Drinks)
    * innerhalb Ziel/“ok”
    * über Ziel/“drüber”
* Klick auf Tag öffnet Tagesdetail:

    * Liste der Drinks + Zeiten
    * Tages-Summen
    * Peak-BAC + “nüchtern um”
    * optional Notizfeld

#### 4.6 Statistik (minimal)

Zeitraum: Woche und Monat (umschaltbar)

* Anzahl Drinks
* Anzahl Trink-Tage
* Anzahl alkoholfreie Tage
* Peak-BAC max/avg (optional, wenn leicht)
* Fortschritt: wie oft Ziel eingehalten (optional)

### 5) Berechnungsvorschriften (BAC in ‰)

Implementiere eine konsistente, dokumentierte Schätzung.

**5.1 Alkoholgramm pro Drink**

* `gramsAlcohol = volumeMl * (abvPercent/100) * 0.789`

    * 0.789 g/ml = Dichte Ethanol

**5.2 Widmark-ähnliche Schätzung (vereinfachtes Modell)**

* Verwende `r` (Körperwasseranteil):

    * Wenn sex gewählt: setze Default `r` passend (du darfst in der App erklären “typischer Standardwert”).
    * Wenn r direkt angegeben: nutze den Wert.
* Brutto-BAC-Zuwachs aus aufgenommenem Alkohol:

    * `bacIncreasePermille = gramsAlcohol / (weightKg * r)`

**5.3 Absorption (MVP-Modell)**
Damit die Kurve realistischer ist, erfolgt die Aufnahme nicht instant:

* Jedes Getränk “wirkt” linear über `absorptionMinutes` (z. B. 30–45 Minuten).
* Während dieser Zeit steigt der Beitrag des Drinks graduell an.

**5.4 Abbau**

* Linearer Abbau: `eliminationRatePermillePerHour` (Default, editierbar).
* BAC kann nicht < 0 werden.

**5.5 BAC-Zeitreihe**

* Erzeuge eine Zeitreihe (z. B. 1-Minuten-Schritte) vom Sessionstart bis `now + horizonHours` (z. B. 18h).
* BAC(t) = Summe aller anteilig absorbierten Drink-Beiträge bis t minus Abbau.
* Output:

    * aktueller BAC bei “now”
    * Peak-BAC
    * “nüchtern um” = erste Zeit t, wo BAC(t) ≤ 0.0 (oder definierter Threshold)

### 6) Validierungen & Edge Cases

* Wenn Profil fehlt: keine Berechnung, stattdessen CTA “Profil anlegen”.
* Wenn r oder Gewicht ungültig: blockiere, zeige konkrete Fehlermeldung.
* Wenn Nutzer:in Drinks in Vergangenheit einträgt: Kurve neu berechnen.
* Bei sehr vielen Drinks: Kurve darf berechnet werden, ohne dass UI blockiert (ggf. vereinfachen).
* Zeitumstellungen / Zeitzonen: Konsistente Speicherung und Darstellung (lokale Zeit genügt).
* Datenintegrität: Löschen eines Drinks wirkt sofort auf Kurve, Peak, Nüchternzeit.

### 7) Texte / Tonalität (fachlich)

* Nicht moralisch, nicht beschämend.
* Fokus auf Selbstbestimmung (“du entscheidest”), Erinnerung an Ziel, Pausen & Wasser.
* Deutlicher Hinweis: “Schätzung – nicht zur Beurteilung von Fahrtüchtigkeit”.
