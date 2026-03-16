# Deep Link Offers — Schritt-für-Schritt Anleitung

## Wie funktioniert das Ganze?

```
Du erstellst Link   →   User klickt Link   →   App erkennt Offer   →   Passende Paywall
(DeepLinkNow)           (Instagram/TikTok)      (automatisch)           (automatisch)
```

Es gibt **3 Paywall-Varianten**. Welche angezeigt wird, hängt davon ab, wie der User die App öffnet:

| Variante | Wann? | Onboarding | Paywall |
|----------|-------|------------|---------|
| **Standard** | User kommt organisch (kein Deep Link) | Alle 11 Screens | Normaler 7-Tage Trial |
| **Influencer** | User kommt über Influencer-Link | Nur Profil (3 Screens) + Paywall | "EXCLUSIVE OFFER", 14 Tage Trial |
| **Gift** | User kommt über Gift-Link | Nur Profil (3 Screens) + Paywall | "FREE FOR YOU", Preis durchgestrichen |

---

## Neuen Influencer-Link erstellen

### Schritt 1: DeepLinkNow Dashboard

1. Öffne [deeplinknow.com/dashboard](https://deeplinknow.com/dashboard)
2. Klicke **"Create Deep Link"**
3. Setze **Target URL** auf: `drink-tracking://paywall`
4. Füge diese **Metadata** ein:

```json
{
  "offer": "influencer_trial",
  "influencer_name": "max_mustermann",
  "trial_days": 14
}
```

5. Kopiere den generierten Short Link (z.B. `https://glasscount.deeplinknow.com/abc123`)
6. Sende den Link an den Influencer

**Fertig.** Mehr musst du nicht tun. Die App erkennt den Link automatisch und zeigt die Influencer-Paywall.

### Was passiert im Hintergrund?

```
User klickt Link in Instagram Bio
    ↓
Browser öffnet sich → App Store (wenn nicht installiert) oder App direkt
    ↓
App startet → DeepLinkNow erkennt User via Fingerprint
    ↓
Offer wird aus Metadata gelesen: offer=influencer_trial, name=max_mustermann
    ↓
Abgekürztes Onboarding: Geschlecht → Gewicht → Volumen-Einheit
    ↓
Influencer-Paywall: "Your exclusive offer from @max_mustermann" + "14 DAYS FREE"
```

---

## Neuen Gift-Link erstellen

Gleicher Prozess, nur andere Metadata:

```json
{
  "offer": "free"
}
```

Oder mit Quelle:

```json
{
  "offer": "gift",
  "influencer_name": "gewinnspiel_account"
}
```

---

## Metadata-Referenz

| Feld | Pflicht | Werte | Beschreibung |
|------|---------|-------|-------------|
| `offer` | Ja | `influencer_trial`, `free`, `gift` | Bestimmt die Paywall-Variante |
| `influencer_name` | Nein | z.B. `"max_mustermann"` | Wird als "@max_mustermann" angezeigt |
| `trial_days` | Nein | z.B. `14` (Standard: 14) | Anzahl Trial-Tage in der Anzeige |

---

## RevenueCat: Wichtiger Hinweis zum Trial

Die Paywall **zeigt** zwar "14 DAYS FREE" an, aber der tatsächliche Trial-Zeitraum wird von Apple/Google bestimmt, nicht von unserer App.

**Damit der Trial tatsächlich 14 Tage ist**, muss ein separates Produkt konfiguriert werden:

1. **App Store Connect / Google Play Console:**
   - Neues Abo-Produkt mit 14-Tage Introductory Offer anlegen

2. **RevenueCat Dashboard:**
   - Neues Offering erstellen mit Identifier `influencer_offer`
   - Das 14-Tage-Produkt zuweisen

3. **Metadata im Deep Link ergänzen:**
   ```json
   {
     "offer": "influencer_trial",
     "influencer_name": "max_mustermann",
     "trial_days": 14,
     "offering_id": "influencer_offer"
   }
   ```

> Ohne separates Offering zeigt die UI "14 DAYS FREE", aber Apple/Google gewähren nur den Standard-Trial (7 Tage).

---

## Testen

### Schnelltest mit Dev-Override (ohne echten Link)

In `src/config/featureFlags.ts` den `devOfferOverride` ändern:

```typescript
// Influencer testen:
export const devOfferOverride: OfferType | null = 'influencer_trial';

// Gift testen:
export const devOfferOverride: OfferType | null = 'gift';

// Standard testen:
export const devOfferOverride: OfferType | null = null;
```

Dann Profil in Settings löschen → App neu starten → Onboarding startet.

> **Vor jedem Build auf `null` zurücksetzen!**

### Direct Deep Link testen (Simulator)

```bash
# Influencer
npx uri-scheme open "drink-tracking://paywall?offer=influencer_trial&influencer_name=TestUser" --ios

# Gift
npx uri-scheme open "drink-tracking://paywall?offer=free" --ios
```

### Deferred Deep Link testen (echtes Gerät)

1. App vom Gerät löschen
2. Deep Link im Browser öffnen
3. App aus Store installieren
4. App öffnen → DeepLinkNow matcht via Fingerprint

---

## Checkliste für neue Kampagne

- [ ] Deep Link im DeepLinkNow Dashboard erstellen
- [ ] Metadata korrekt befüllen (`offer`, `influencer_name`)
- [ ] Link testen (Dev-Override oder Simulator)
- [ ] Optional: Separates RevenueCat Offering für speziellen Trial
- [ ] Short Link an Influencer senden
- [ ] In PostHog prüfen: `deep_link_offer_applied` Event

---

## Architektur

```
DeepLinkNow Dashboard          RevenueCat Dashboard
    │ (Metadata)                    │ (Offerings/Produkte)
    ▼                               ▼
deepLinkService.ts ──────► useOfferStore.ts ◄────── revenueCatService.ts
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              STANDARD    INFLUENCER     GIFT
              _FLOW       _FLOW          _FLOW
              (11 Screens) (4 Screens)   (4 Screens)
                    │          │          │
                    ▼          ▼          ▼
                      PaywallContent.tsx
                      (rendert passende Variante)
```

### Relevante Dateien

| Datei | Zweck |
|-------|-------|
| `src/services/deepLinkService.ts` | DeepLinkNow SDK Wrapper |
| `src/ui/hooks/useOfferStore.ts` | Offer-State (Zustand) |
| `src/ui/components/onboarding/flows.ts` | Flow-Definitionen (welche Screens pro Variante) |
| `src/ui/components/onboarding/PaywallScreen.tsx` | Paywall-Logik pro Variante |
| `src/ui/components/PaywallContent.tsx` | Paywall-UI (alle 3 Varianten) |
| `src/config/featureFlags.ts` | Dev-Override zum Testen |
| `app/_layout.tsx` | Deep Link Initialisierung + Handling |
