# Template Updates

So hältst du deine Apps mit dem Template synchron -- ohne NPM Packages, nur mit Git.

## Konzept

Jede App hat neben `origin` (eigenes Repo) ein zweites Git Remote namens `template`, das auf dieses Template-Repo zeigt. Template-Änderungen kannst du jederzeit per `git merge` in eine App übernehmen.

```
my-app (Git Repo)
  ├── origin   → github.com/your-org/my-app              (die App)
  └── template → github.com/your-org/expo-app-template    (dieses Repo)
```

Du entscheidest pro App **wann** und **ob** du Updates übernimmst.

---

## Einrichtung (einmalig pro App)

```bash
cd my-app
git remote add template git@github.com:your-org/expo-app-template.git
git fetch template
```

Prüfen, ob es geklappt hat:

```bash
git remote -v
# origin   git@github.com:your-org/my-app.git (fetch)
# origin   git@github.com:your-org/my-app.git (push)
# template git@github.com:your-org/expo-app-template.git (fetch)
# template git@github.com:your-org/expo-app-template.git (push)
```

---

## Template-Updates in eine App übernehmen

### 1. Neuesten Stand holen

```bash
git fetch template
```

### 2. Änderungen ansehen (optional, empfohlen)

```bash
# Was hat sich im Template geändert seit dem letzten Merge?
git log --oneline HEAD..template/main

# Diff ansehen
git diff HEAD...template/main
```

### 3. Mergen

```bash
git merge template/main
```

Falls es der allererste Merge ist (Repo wurde nicht per Fork erstellt):

```bash
git merge template/main --allow-unrelated-histories
```

### 4. Konflikte lösen

Konflikte entstehen nur in Dateien, die **sowohl im Template als auch in der App** geändert wurden. Bei sauberer Trennung von Infrastructure und Features sind das wenige Dateien.

Typische Kandidaten für Konflikte:
- `app/_layout.tsx` (wenn du dort App-spezifisches geändert hast)
- `src/config/appConfig.ts` (App-Identität -- immer deine Version behalten)
- `package.json` (Dependencies -- manuell zusammenführen)

Dateien die fast nie Konflikte haben:
- `src/infrastructure/*` (nur das Template ändert hier)
- `src/features/*` (nur die App ändert hier)
- `src/ui/theme/*` (selten geändert)

---

## Mit Releases arbeiten

### Template-Releases taggen

Im Template-Repo:

```bash
git tag v1.0 -m "Basis-Release"
git tag v1.1 -m "RevenueCat v8 + Family Sharing"
git tag v1.2 -m "Analytics: PostHog → Amplitude Migration"
git push origin --tags
```

### Bestimmte Version in eine App mergen

```bash
cd my-app
git fetch template --tags
git merge v1.1    # statt template/main
```

### Apps auf unterschiedlichen Ständen halten

```
App-1  → v1.2  (neuester Stand, Testkandidat)
App-2  → v1.1  (stabil, bewährt)
App-3  → v1.0  (noch nicht aktualisiert)
```

---

## Feature-Branches selektiv mergen

Wenn du ein neues Template-Feature erst in einer App testen willst, bevor es in alle geht:

### 1. Feature-Branch im Template erstellen

```bash
cd expo-app-template
git checkout -b feature/family-sharing
# ... Änderungen ...
git push origin feature/family-sharing
```

### 2. Nur in einer Test-App mergen

```bash
cd my-app-1
git fetch template
git merge template/feature/family-sharing
# → testen
```

### 3. Bei Erfolg: ins Template mergen und für alle freigeben

```bash
cd expo-app-template
git checkout main
git merge feature/family-sharing
git tag v1.3 -m "Family Sharing"
git push origin main --tags
```

Andere Apps holen es sich, wenn sie bereit sind:

```bash
cd my-app-2
git fetch template
git merge template/main   # oder: git merge v1.3
```

---

## Mehrere Apps auf einmal updaten

Einfaches Shell-Script für wiederkehrende Updates:

```bash
#!/bin/bash
# update-all-apps.sh

APPS=(
  ~/projects/app-1
  ~/projects/app-2
  ~/projects/app-3
)

for app in "${APPS[@]}"; do
  echo "=== Updating $(basename $app) ==="
  cd "$app"
  git fetch template
  git merge template/main --no-edit
  if [ $? -ne 0 ]; then
    echo "KONFLIKT in $(basename $app) -- manuell lösen!"
  fi
  echo ""
done
```

---

## Tipps

- **Merge oft, merge früh.** Kleine, häufige Merges erzeugen weniger Konflikte als seltene große.
- **Template-Commits klein halten.** Ein Commit pro logische Änderung erleichtert das Konflikt-Lösen.
- **`appConfig.ts` ist immer App-spezifisch.** Bei Konflikten hier: immer deine App-Version behalten.
- **Vor dem Merge: sauberen Stand sicherstellen.** Keine uncommitteten Änderungen in der App.
- **Nach dem Merge: Tests laufen lassen.** `npm test` und ein kurzer Build-Check.
