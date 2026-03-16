# Unit System Improvement

**Status:** Planned (Post-MVP)
**Priority:** Medium
**Effort:** Low

## Problem

Currently users must configure units individually across multiple settings:
- Weight: kg / lb
- Volume: ml / oz
- BAC Level: % / permille

This creates unnecessary cognitive load and multiple onboarding steps. For MVP we target the US market only, so defaults (lb, oz, %) are sufficient. But for international expansion this needs improvement.

## Current State (MVP)

- DB defaults are US-oriented: `lb`, `oz`, `percent`
- Onboarding asks for weight unit (Screen 8) and volume unit (Screen 9)
- BAC unit is hardcoded to `percent` during onboarding, changeable only in Settings
- Individual toggles exist in Settings for volume and BAC unit
- Internal storage is always metric (kg, ml, permille) - conversion happens at UI boundary

**For MVP this is fine** - US market only, defaults match the target audience.

## Proposed Solution

### Phase 1: Auto-Detect from Device Locale

Remove unit selection from onboarding entirely. Instead, detect the user's device locale and set units automatically:

| Locale | Weight | Volume | BAC |
|--------|--------|--------|-----|
| `en-US` | lb | oz | % |
| `en-GB` | kg (Imperial uses stones but kg is simpler) | ml | % |
| `de-*`, `fr-*`, `es-*`, etc. | kg | ml | permille |
| Fallback | kg | ml | permille |

**Implementation:**
- Use `expo-localization` to read device locale
- Map locale to unit preset during profile creation
- Remove unit selection screens from onboarding (saves 1-2 steps)
- Reduces onboarding friction significantly

**Why this matters:**
- 70% of users drop off after one session if onboarding feels confusing or too long
- Apps that simplify onboarding see ~50% higher retention
- Every removed step reduces drop-off risk

### Phase 2: System Preset in Settings

Add a "Unit System" preset selector at the top of the Units section in Settings:

```
┌─────────────────────────────────┐
│  Unit System                    │
│  ┌──────────┐ ┌──────────┐     │
│  │  Metric  │ │ Imperial │     │
│  └──────────┘ └──────────┘     │
│                                 │
│  Weight      [kg ↔ lb]         │
│  Volume      [ml ↔ oz]         │
│  BAC Level   [‰  ↔  %]        │
└─────────────────────────────────┘
```

**Behavior:**
- Tapping "Metric" sets all toggles to: kg, ml, permille
- Tapping "Imperial" sets all toggles to: lb, oz, %
- Individual toggles remain visible and editable for edge cases (e.g. user wants kg but oz)
- Changing an individual toggle does NOT change the preset indicator (it becomes a "mixed" state)

**Preset Mappings:**

| Preset | Weight | Volume | BAC |
|--------|--------|--------|-----|
| Metric | kg | ml | permille |
| Imperial | lb | oz | percent |

### What NOT to Do

- **No "Custom" option** - Sounds technical and creates uncertainty. Better: pick a preset, then adjust individual toggles if needed.
- **No unit selection in onboarding** - Auto-detect handles this. Users who care about units will find Settings.
- **No "Imperial / Metric / Custom" triple-choice** - Two clear options + individual overrides is cleaner.

## Technical Notes

- No data model changes needed - `UserProfile` already stores `weightUnit`, `volumeUnit`, `bacUnit` individually
- No conversion logic changes - the single-source-of-truth pattern (metric internal, convert at UI boundary) stays the same
- Auto-detect only runs on first profile creation, not on every app launch
- `expo-localization` is already available in the Expo ecosystem

## Research & References

- [UXmatters: Regionalizing Mobile Designs](https://www.uxmatters.com/mt/archives/2021/01/regionalizing-your-mobile-designs-part-2.php) - Set defaults based on geolocation/locale
- [MyFitnessPal](https://support.myfitnesspal.com/hc/en-us/articles/360032623891-How-do-I-change-my-preferred-units-of-measure) - Units configurable in Settings, not during onboarding
- [Mobile Onboarding Best Practices 2026](https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/) - 70% drop-off if onboarding feels confusing
- [Fitness App UX](https://stormotion.io/blog/fitness-app-ux/) - Simplified onboarding increases retention by ~50%

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-02-09 | Defer to post-MVP | US market only for now, defaults already match. Releasing is higher priority. |
| 2026-02-09 | Auto-detect approach chosen over manual selection | Minimizes cognitive load, removes onboarding steps |
| 2026-02-09 | Keep individual toggles visible in Settings | Gives users full control without hiding options behind "Custom" |
