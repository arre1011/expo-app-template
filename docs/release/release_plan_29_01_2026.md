## Nächste Schritte (kurz & knackig) – damit du so schnell wie möglich live gehst

### 1) Paywall im Onboarding fertig machen (heute/als Nächstes)

**Was:** Paywall im Onboarding anzeigen + Kauf-Flows für **Monat/Jahr** (Abo) + **Lifetime** (One‑time) vollständig.
**Warum:** Ohne funktionierende Paywall kann Review scheitern oder du verschwendest Review-Zeit, weil Tester/Reviewer nicht kaufen können.

**Mini-Checklist in der App:**

* Preis/Laufzeit sichtbar, Auto‑Renew Hinweis (für Abos)
* **Restore Purchases** (sichtbar + funktioniert)
* **Manage Subscription** Link (iOS/Android)
* Entitlements/Unlocking in RevenueCat sauber (Premium-Status überall gleich, ist aber galub in unserer app nicht notwendig, da wir es kein premuim gibt)

---

### 2) RevenueCat final verdrahten (parallel)

**Was:** Produkte/Entitlements prüfen:

* iOS: Abo-Produkte + Lifetime korrekt gemappt
* Android: Subscription **Base Plans** korrekt in RevenueCat gemappt (typisch `subId:basePlanId`)
  **Warum:** Falsches Mapping = Käufe funktionieren nicht = Review/QA fällt durch.

---

### 3) Store Assets & Pflichtangaben fertigstellen (parallel, spätestens vor Submit)

**Was:**

* **Beschreibung**, Keywords/Tags, Kategorien
* **Screenshots** (min. die Pflicht-Sets)
* **Privacy Policy URL** + Support-Kontakt + ggf. Terms
  **Warum:** Ohne diese Pflichtfelder kannst du nicht submitten (oder bekommst Policy-Blocker).

---

### 4) Apple: „Release Candidate“ über TestFlight testen, dann **einmal** sauber submitten

**Was:**

* Build in TestFlight testen (Kauf, Restore, Abo-Status)
* In App Store Connect: IAPs der Version zuordnen + **Review Notes** (wie kommt man zur Paywall, ggf. Test-Account)
* **Manual release** auswählen
  **Warum:** Apple erlaubt praktisch nur **eine Version gleichzeitig in Review**. Du willst nicht dauernd zurückziehen und neu einreichen.

---

### 5) Google Play: sofort Konsole + Internal Test (heute)

**Was:**

* Play Console App anlegen
* **AAB** bauen und in **Internal testing** hochladen
* „App content“ (Data Safety, Privacy, etc.) soweit wie möglich ausfüllen
  **Warum:** Du entkoppelst Technik/Signing/Upload-Probleme vom finalen Production-Release.

---

### 6) Google: Falls Account neu → **Closed Test sofort starten** (kritisch)

**Was:**

* Closed testing mit Opt‑in Testern starten (wenn du unter die 12/14‑Regel fällst)
  **Warum:** Das ist der häufigste Zeitkiller für einen schnellen Android‑Production‑Launch.

---

### 7) Kurz vor Release: “Freeze” + Review/Release-Steuerung

**Was:**

* Letzte Stabilisierung (Crash-free, Kauf-Flows)
* Google: optional **Managed Publishing** aktivieren
* Apple: bleibt auf **Manual release**
  **Warum:** Du willst nach Approval selbst bestimmen, **wann** es live geht, statt Überraschungen.

---

## Reihenfolge als 48h-Plan (wenn’s brennt)

1. Paywall + Restore/Manage Subscription fertig
2. RevenueCat Mapping (iOS + Android Base Plans)
3. Apple: TestFlight RC → Submit mit Manual Release + Review Notes
4. Google: Play Console + Internal Test Upload → wenn nötig Closed Test starten
5. Store Assets finalisieren, während Reviews laufen
