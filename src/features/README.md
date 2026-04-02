# Features

Dieses Verzeichnis enthält die gesamte Feature-Logik der App, aufgeteilt in vier Kategorien.

## Ordnerstruktur

```
features/
  core/           ← Template-Features, die jede App braucht
  optional/       ← Template-Features, die nicht jede App braucht
  _showcase/      ← Referenz-Implementierungen zum Abschauen (nur DEV)
  app-specific/   ← Hier kommt die eigentliche App-Logik rein
```

## core/

Features die zum Template gehören und in jeder App bleiben. Werden über Template-Updates gepflegt.

| Feature | Beschreibung |
|---------|-------------|
| `home/` | Home-Screen (Platzhalter, wird app-spezifisch angepasst) |
| `onboarding/` | Generisches Onboarding mit Paywall-Flow, User Profile, Motivations |
| `subscription/` | RevenueCat Paywall, Subscription Wall, Trial Reminder, Offer Store |
| `settings/` | Settings-Screen mit Subscription- und Dev-Bereich |
| `privacy/` | Privacy Policy Screen |

**Regel:** Änderungen an Core-Features möglichst im Template-Repo machen, nicht in der App.

## optional/

Template-Features die du bei App-Erstellung behältst oder löschst. Siehe `docs/template/new-app-setup.md` Schritt 5.

| Feature | Beschreibung |
|---------|-------------|
| `calendar/` | Kalender mit Day Detail Sheet, Year View, Journal Entries |
| `statistics/` | Statistics-Screen (Platzhalter) |

**Wenn du ein optionales Feature nicht brauchst:**
1. Lösche den Feature-Ordner hier
2. Lösche die zugehörige Route in `app/(tabs)/`
3. Entferne den Feature Flag in `src/config/featureFlags.ts`
4. Entferne den Tab-Eintrag in `app/(tabs)/_layout.tsx`

## _showcase/

Referenz-Implementierungen für gängige UI-Patterns: BottomSheet, WheelPicker, Cards, SearchSheet, FormValidation. Nur im DEV-Modus sichtbar.

**Workflow:** Patterns anschauen → was du brauchst in `app-specific/` kopieren und anpassen → `_showcase/` Ordner löschen.

## app-specific/

Hier kommt alles rein, was spezifisch für deine App ist. Jedes Feature bekommt einen eigenen Ordner mit allem was es braucht:

```
app-specific/
  bmi-chart/
    components/
    hooks/
    state/
    data/          ← Schema, Repository (falls DB-Zugriff nötig)
    types.ts
    index.ts
  meal-tracker/
    ...
```

**Regeln:**
- Jeder Feature-Ordner enthält seine eigenen Components, Hooks, State, Data, Types
- `index.ts` ist die öffentliche API -- andere Features importieren nur darüber
- Features greifen nicht in die Interna anderer Features
- Geteilte UI-Bausteine gehören nach `src/ui/components/`
- DB-Schemas müssen in `src/infrastructure/sqlite/schema.ts` registriert werden
