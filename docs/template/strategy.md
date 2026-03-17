# Template Strategy

How this repo is used to build and maintain multiple apps as a solo developer.

---

## Overview

```
Phase 1 (current)          Phase 2 (future)
─────────────────          ──────────────────

expo-app-template/         shared-packages/
  ├── src/                   packages/
  ├── app/                     @myscope/theme/        → npm v1.2.0
  └── ...                      @myscope/ui-components → npm v1.0.3
       │                       @myscope/onboarding/   → npm v2.0.0
       │ "Use as template"            │
       ▼                              │  npm install
  ┌─────────┐                  ┌──────┴──────┐
  │ App A   │                  │ App A       │  "@myscope/theme": "^1.2.0"
  │ App B   │                  │ App B       │  "@myscope/theme": "^1.1.0"
  └─────────┘                  └─────────────┘
                               Each app pins its own version
```

---

## Phase 1: Template Repo (current)

**What:** This repo is a cleaned-up, generic app template extracted from a production app (GlassCount). Domain-specific code is removed, reusable infrastructure stays.

**How to use:**
1. Create a new repo from this template (GitHub "Use this template" or manual clone)
2. The new repo is fully independent — no fork connection
3. Customize: app name, colors, feature flags, domain logic
4. Build your app on top of the existing infrastructure

**What's included:**
- Navigation (Expo Router, bottom tabs)
- Onboarding flow
- Subscription management (RevenueCat)
- Settings screen
- Calendar with daily notes
- Theme system (colors, spacing, typography)
- Bottom sheet modals (@gorhom/bottom-sheet)
- SQLite persistence layer
- Error tracking (Sentry)
- Analytics (PostHog)
- Push notifications
- Deep linking
- Feature flags
- Examples tab (dev storybook)

**Limitations:**
- Changes to shared patterns (theme, components) must be manually copied between apps
- No automatic sync between template and derived apps

---

## Phase 2: Shared npm Packages (future)

**When:** When you find yourself copying the same fix/improvement across multiple apps.

**What:** Extract shared code into private npm packages. Each app installs them as dependencies and controls its own version.

**Package candidates:**

| Package | What it contains |
|---------|-----------------|
| `@myscope/theme` | Colors, spacing, typography, borderRadius tokens |
| `@myscope/ui-components` | Card, ModalHeader, CalendarLegend, etc. |
| `@myscope/onboarding` | Onboarding flow components + logic |
| `@myscope/bottom-sheets` | Sheet patterns (search, picker, form) |
| `@myscope/db` | SQLite connection, migration helpers, base repository |

**How it works:**
```
shared-packages/               ← Separate repo
  packages/
    @myscope/theme/            ← npm package v1.2.0
    @myscope/ui-components/    ← npm package v1.0.3

app-a/                         ← Independent repo
  package.json
    "@myscope/theme": "^1.2.0"

app-b/                         ← Independent repo
  package.json
    "@myscope/theme": "^1.1.0" ← Can use older version
```

**Key benefits:**
- Each app decides when to upgrade
- A breaking change in a package doesn't affect apps until they opt in
- Packages are versioned with semver

**Publishing options (private packages):**

| Option | Cost | Notes |
|--------|------|-------|
| GitHub Packages | Free (with GitHub Pro) | Integrated with GitHub, minimal setup |
| Verdaccio | Free (self-hosted) | Local npm registry, zero config |
| npm private | ~$7/month | Easiest setup |

---

## Transition: Phase 1 → Phase 2

You don't need to plan Phase 2 upfront. The transition happens naturally:

1. **Notice the pain** — You fix a bug in the theme and realize you need to copy it to 2 other apps
2. **Extract one package** — Start with the most-shared code (probably `@myscope/theme`)
3. **Publish and install** — Replace the local `src/ui/theme/` with `npm install @myscope/theme`
4. **Repeat** — Extract more packages as needed

**Rule of thumb:** Don't extract until you have at least 2 apps sharing the same code AND you've made changes to that code that needed to be copied.

---

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-03-16 | Start with template repo, not monorepo | Solo developer — monorepo overhead not justified |
| 2026-03-16 | Strip-down approach (not rebuild) | Keep battle-tested patterns from production app |
| 2026-03-16 | Feature flags for all optional features | Easy to enable/disable per app |
| - | Phase 2 trigger: TBD | When manual copying becomes painful |
