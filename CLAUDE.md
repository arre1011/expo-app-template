# Project Overview

This repository contains a React Native Expo mobile app for tracking alcoholic drinks and estimating the user's blood alcohol concentration (BAC). The goal is to encourage mindful consumption through harm reduction. The app must **never** suggest that it can be used to judge fitness to drive or make safety decisions.

## Goals & Scope (MVP)

- Collect user profile data (weight, biological constants) for BAC calculations.
- Allow users to quickly log drinks with volume, ABV and timestamp.
- Show current estimated BAC and a simple forecast indicating when the user will be sober.
- Display the BAC time‑series on a line chart.
- Support a daily drinks limit and show a “Stop” prompt when the limit is reached or exceeded.
- Provide a calendar‑based history with daily summaries and simple weekly/monthly statistics.
- Optional: gentle reminders (opt‑in) only if trivial to implement.

Out of scope: social features, cloud sync of drink data, medical/diagnostic feedback, and any "you are safe to drive" signal.

## Language

- **App Language:** English only (for MVP)
- **Store Listings:** English (primary), German localization planned for future
- **In-App Text:** All UI strings are in English

## Design & Assets

The UI design (HTML and PNG screenshots) lives in `docs/ui/`. When implementing screens, always refer to these assets and follow the non‑judgemental tone. Each BAC value shown must be clearly labelled as an estimate and accompanied by harm‑reduction wording.

Functional and technical specs live in `docs/prompts/vibecoding_prompt.md`. Read this document before starting new features.

## Tech Stack & Architecture

- **Platform:** React Native (Expo), TypeScript (strict).
- **State Management:** Zustand for app state; separate UI state from persisted data.
- **Persistence:** SQLite via a repository layer; no backend sync in the MVP.
- **Subscriptions:** RevenueCat for cross-platform subscription management (iOS + Android). Provides unified API for Apple StoreKit and Google Play Billing, automatic receipt validation, and cross-platform subscription status sync.
- **Charts:** Use `victory-native` for the BAC line chart.
- **Modals:** `@gorhom/bottom-sheet` for iOS-style bottom sheet modals with swipe-to-dismiss (cross-platform consistent).
- **Structure:** Separate **Domain/Core** (BAC calculations, validation), **Data** (repositories and SQLite), and **UI** (screens, components, navigation). The UI calls use‑cases/services, never directly the DB or calculation logic.
- **Navigation:** Bottom tabs for Session, Calendar, Statistics and Settings. Add‑Drink is a modal accessible from Session or day-detail.
- **Tests:** Unit tests for core BAC logic and at least one integration test for adding a drink and updating BAC.

### Unit Conversion Pattern (Single Source of Truth)

All measurements are stored internally in metric units:
- **Weight:** Always stored as `kg` in database (`weightKg` field)
- **Volume:** Always stored as `ml` in database (`volumeMl` field)

User display preferences (`weightUnit`, `volumeUnit`) are stored in `UserProfile`.
Conversion happens only at the UI boundary:
- **Input:** Convert user's unit → metric before saving
- **Output:** Convert metric → user's unit for display

Utility functions in `src/domain/utils/`:
- `weightConversion.ts` - kg ↔ lb conversion
- `volumeConversion.ts` - ml ↔ oz conversion

## Data Model (Persisted)

- `UserProfile`: `weightKg`, `sex` or `bodyWaterConstantR`, `eliminationRatePermillePerHour`, timestamps.
- `Session`: `id`, `startTime`, `endTime`, `peakBAC`, `peakTime`, `totalStandardUnits`, timestamps. A session spans from first drink until BAC returns to 0.
- `DrinkEntry`: `id`, `timestamp`, `type`, `volumeMl`, `abvPercent`, `sessionId`, optional `label` and `notes`, timestamps.
- `DailyGoal`: `date`, `maxBAC`, `enabled`.

Session status (active/completed) is computed from `endTime`, not stored. See `docs/architecture/session-based-architecture.md` for details.

## Session Architecture

Sessions are the core domain concept. A **session** spans from the first drink until BAC returns to 0.

**Key Principle**: When any drink changes (add, edit, delete), ALL sessions are recalculated from scratch using the "Merge Overlapping Intervals" algorithm. This guarantees consistency.

**Architecture Layers**:
- Calculator (`sessionCalculator.ts`) - Pure functions, no DB
- Service (`sessionService.ts`) - Orchestration
- Repository (`sessionRepository.ts`) - DB operations
- Store (`useAppStore.ts`) - State management

**Critical Rules**:
- Delete drink FIRST, then recalculate sessions
- When merging drinks, recalculate sober time (alcohol adds up!)

For details see [docs/architecture/session-based-architecture.md](docs/architecture/session-based-architecture.md).

## Implementation Guidance

- Always indicate BAC values are estimates (“Schätzung”). Avoid moralising language; focus on self‑determination and harm reduction.
- Enforce mandatory fields during onboarding; show a clear disclaimer about not using the app for driving decisions.
- Build iteratively: implement core calculation and data models first, then persistence, then UI screens and navigation, then charts and goal nudges.
- The app must run entirely offline; design the data layer and state management accordingly.
- Keep the repository README up to date with setup, build and test instructions, and document the BAC calculation assumptions.

## Design System

All styling must use centralized theme tokens from `src/ui/theme/`. Never use hardcoded values for colors, spacing, typography, or border radius.

### Theme Files

- `src/ui/theme/colors.ts` - All color definitions
- `src/ui/theme/spacing.ts` - Spacing, borderRadius, fontSize, fontWeight
- `src/ui/theme/index.ts` - Unified exports

### 4/8-Point Grid System

All spacing follows a 4px base grid. Use only these tokens:

```typescript
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
```

**Usage rules:**
- Padding/margins: Always use `spacing.*` tokens
- Never use arbitrary values like `marginTop: 2` or `padding: 10`
- For half-steps (rare cases), use `spacing.xs` (4px)

### Typography

```typescript
fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32, display: 48 }
fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' }
```

**Guidelines:**
- Body text: `fontSize.md` (16px) - optimal mobile readability
- Minimum interactive text: `fontSize.sm` (14px)
- Line height: 1.4-1.6x font size
- Always use `fontWeight.*` tokens, never hardcoded strings

### Border Radius

```typescript
borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 }
```

**Usage:**
- Buttons: `borderRadius.md` (12px)
- Cards: `borderRadius.lg` (16px)
- Pills/tags: `borderRadius.full`
- Never use hardcoded values like `borderRadius: 16`

### Colors

All colors must be defined in `colors.ts`. Use semantic names:

```typescript
// Primary
primary, primaryLight, primaryDark

// Background
background, backgroundSecondary, card

// Text
text, textSecondary, textLight, textOnPrimary

// Status
success, successLight, warning, warningLight, error, errorLight

// Calendar
sober (green), moderate (yellow), overLimit (red)

// Utility
border, shadow, overlay, transparent
```

**Rules:**
- Never use hardcoded hex values in components (e.g., `'#FFFFFF'`)
- Shadow colors: Use `colors.shadow` or define new token
- Drink type colors must be defined in `colors.ts`, not duplicated across components

### Shadows

Use consistent shadow definitions. Standard elevation levels:

```typescript
// Low elevation (cards)
shadowColor: colors.shadow,
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.04,
shadowRadius: 3,
elevation: 1,

// Medium elevation (modals, floating elements)
shadowColor: colors.shadow,
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 6,
elevation: 3,
```

### Touch Targets

- Minimum touch target: **44x44 points** (iOS HIG) / **48x48 dp** (Material)
- Use `hitSlop` for small visual elements: `{ top: 10, bottom: 10, left: 10, right: 10 }`

### Accessibility

- Minimum contrast ratio: **4.5:1** (WCAG AA)
- Never disable buttons without clear feedback (see Form Validation below)
- Support Dynamic Type where possible

## UX/UI Best Practices

Always follow modern UX/UI best practices and industry standards. Prioritize user clarity, accessibility, and intuitive interactions. When in doubt, research current design patterns for mobile apps.

### Form Validation
- **Never use disabled buttons without clear feedback.** Users must understand why they cannot proceed.
- **Preferred approach:** Keep buttons active. On submit, validate and highlight missing/invalid fields with red borders and inline error messages.
- **Optional enhancement:** Real-time validation with visual feedback (green checkmarks for valid fields) as users type.
- **Avoid:** Disabled buttons that leave users guessing what's missing.

### Modal Design Pattern (iOS Style)
All modals use `@gorhom/bottom-sheet` for a native iOS-style bottom sheet experience with smooth animations and swipe-to-dismiss.

**Header Layout:**
```
[X Close]     Title     [✓ Save]
```

- **X button** (left): Dismiss/cancel without saving
- **Title** (center): Describes the modal content
- **Save button** (right, optional): Confirm action - only shown for edit/create screens
- **Delete button** (bottom of modal): For destructive actions when applicable
- **Swipe down**: Gesture to dismiss (built into @gorhom/bottom-sheet)
- **Backdrop**: Dark overlay behind sheet
- **Sizing**: Use `enableDynamicSizing={true}` for simple/short modals (confirmations, small forms); use fixed `snapPoints` with `enableDynamicSizing={false}` for scrollable or complex content.

**Dependencies:**
- `@gorhom/bottom-sheet` - Bottom sheet modal component
- `react-native-reanimated` - Required for animations
- `BottomSheetModalProvider` wraps the app in `app/_layout.tsx`

**Reusable Components:**
- `ModalHeader` in `src/ui/components/ModalHeader.tsx` - Standard header with X/Save buttons
- `DayDetailSheet` in `src/ui/components/DayDetailSheet.tsx` - Example bottom sheet modal

**Usage Example:**
```tsx
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

const snapPoints = useMemo(() => ['90%'], []);

<BottomSheetModal
  ref={bottomSheetModalRef}
  snapPoints={snapPoints}
  enablePanDownToClose={true}
  backdropComponent={renderBackdrop}
>
  <ModalHeader title="Title" onClose={handleClose} />
  <BottomSheetScrollView>
    {/* Content */}
  </BottomSheetScrollView>
</BottomSheetModal>
```

## Testing Strategy

**CRITICAL:** Tests must be run after every implementation and before every commit.

### Test Coverage Requirements

- **Domain Logic (MANDATORY):** All BAC calculations, limit logic, and statistics MUST have tests
- **Integration Points (MANDATORY):** Cross-view consistency (home ↔ calendar ↔ statistics) MUST be tested
- **UI Components (OPTIONAL):** React components can be tested but are not required for MVP

### Running Tests

```bash
# Run all tests (REQUIRED before every commit)
npm test

# Run tests in watch mode during development (RECOMMENDED)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

### Test Files Location

All tests live in `__tests__/`:
- `bacCalculator.test.ts` - BAC calculation unit tests
- `limitLogicConsistency.test.ts` - BAC limit modal/calendar consistency tests
- `statisticsIntegration.test.ts` - Statistics and cross-view consistency tests
- `README.md` - Full test suite documentation

### When to Write Tests

**ALWAYS write tests when:**
1. Fixing a bug → Write test that reproduces it first, then fix
2. Adding domain logic → BAC calculations, limits, statistics
3. Changing business rules → Thresholds, goals, calculations

**Test-First Workflow:**
```typescript
// 1. Write failing test
it('should handle new scenario', () => {
  // Test implementation
  expect(result).toBe(expected); // ❌ FAILS
});

// 2. Implement feature
// ... code changes ...

// 3. Verify test passes
npm test // ✅ PASSES
```

### Why Tests Are Critical

Previous bugs that tests now prevent:
- ❌ Adding drinks caused all drinks to disappear from home screen
- ❌ Modal appeared when limit reached, but calendar showed yellow instead of red
- ❌ Inconsistent state between home, calendar, and statistics views

All these bugs are now caught automatically by the test suite.

## Definition of Done

A feature is complete when:

- Code compiles and passes TypeScript strict mode.
- **ALL tests pass (`npm test` shows 100% pass rate).**
- New domain logic has corresponding tests.
- Lint checks pass.
- The UI matches the designs in `docs/ui/` and handles edge cases from the spec.
- Documentation is updated when behaviours change.

---

This `CLAUDE.md` provides Claude Code with high‑level context. For full details, refer to `docs/prompts/vibecoding_prompt.md`.