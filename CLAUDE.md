# Expo App Template

Production-ready React Native (Expo) template with pre-built infrastructure for subscription-based mobile apps.

## Tech Stack

- **Platform:** React Native (Expo), TypeScript (strict)
- **Navigation:** Expo Router, bottom tabs
- **State:** Zustand (separate UI state from persisted data)
- **Persistence:** SQLite via repository layer, fully offline
- **Subscriptions:** RevenueCat (iOS + Android)
- **Modals:** `@gorhom/bottom-sheet` (iOS-style bottom sheets)
- **Charts:** `victory-native`
- **Analytics:** PostHog
- **Error Tracking:** Sentry
- **Notifications:** expo-notifications
- **Wheel Picker:** `@quidone/react-native-wheel-picker`

## Architecture

Three-layer separation — UI never touches DB or domain logic directly.

```
UI (screens, components, navigation)
  ↓ calls
Services / Use Cases (orchestration)
  ↓ calls
Domain (pure logic, validation)  +  Data (repositories, SQLite)
```

- **`src/domain/`** — Pure functions, constants, utils. No side effects.
- **`src/data/`** — Repositories and SQLite. Only accessed through services.
- **`src/services/`** — Orchestration between domain and data.
- **`src/ui/`** — Screens, components, hooks, theme, sheets.
- **`src/config/`** — Feature flags, environment config.
- **`app/`** — Expo Router file-based routes and layouts.

## Design System (Brief)

All styling via centralized tokens in `src/ui/theme/`. **Never hardcode colors, spacing, or font sizes.**

- **Spacing:** 4px grid — `xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48`
- **Colors:** Semantic names only (`primary`, `text`, `error`, etc.) — defined in `colors.ts`
- **Typography:** Use `fontSize.*` and `fontWeight.*` tokens
- **Border Radius:** Use `borderRadius.*` tokens
- **Touch targets:** Min 44x44pt (iOS) / 48x48dp (Android)

## Modal Pattern

All modals use `@gorhom/bottom-sheet` with consistent header layout:

```
[X Close]     Title     [Save]
```

- Swipe-down to dismiss, dark backdrop
- `ModalHeader` component in `src/ui/components/ModalHeader.tsx`
- Dynamic sizing for small modals, fixed `snapPoints` for scrollable content

## Environment Variables

Required in `.env.local`:
```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_DEEPLINKNOW_API_KEY=
```

## Clean Code Rules

1. **Single Responsibility.** One function/component does one thing.
2. **No magic values.** Use constants, enums, or theme tokens.
3. **Fail early.** Validate at boundaries (user input, API responses), trust internal code.
4. **No premature abstraction.** Duplicate is better than the wrong abstraction. Extract only after 3+ repetitions.
5. **Minimal changes.** Only change what's requested. Don't refactor surrounding code, add comments to unchanged code, or "improve" things not asked for.
6. **Name things clearly.** A name should tell you what it does without reading the implementation. Avoid abbreviations.

## React / React Native Best Practices

1. **Components:** Keep them small. Extract when a component exceeds ~100 lines or has distinct responsibilities.
2. **State:** Lift state only when siblings need it. Use Zustand for shared/persisted state, `useState` for local UI state.
3. **Effects:** Minimize `useEffect`. Derive values during render when possible. Never use effects for state synchronization.
4. **Memoization:** Only `useMemo`/`useCallback` when there's a measured performance need or referential stability is required (e.g., deps of other hooks).
5. **Lists:** Always use `FlatList` or `FlashList` for dynamic lists, never `.map()` in ScrollView.
6. **Types:** Prefer `interface` for object shapes, `type` for unions/intersections. No `any`.

## Testing

```bash
npm test              # Run all tests (required before commits)
npm test -- --watch   # Watch mode during development
```

Tests live in `__tests__/`. Write tests for all domain logic and cross-view consistency. Test-first for bug fixes.

## Definition of Done

- TypeScript strict mode passes
- All tests pass
- No hardcoded values (colors, spacing, strings)
- New domain logic has tests
