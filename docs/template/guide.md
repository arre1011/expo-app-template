# Template Guide

This guide explains how to use this template to build a new app. It covers the built-in features, how to enable/disable them, and how the architecture works.

---

## Quick Start

1. Clone or use this template
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local` and add your API keys
4. Run `npx expo start`
5. Customize: change app name in `app.json`, colors in `src/ui/theme/colors.ts`, and feature flags in `src/config/featureFlags.ts`

---

## Feature Flags

All features can be toggled via `src/config/featureFlags.ts`. This is the central control panel.

### Navigation Tabs

| Flag | Default | Description |
|------|---------|-------------|
| `calendarTab` | `true` | Calendar tab with daily notes + mood tracking |
| `statisticsTab` | `true` | Statistics tab |
| `examplesTab` | `__DEV__` | Examples/Storybook tab (auto-hidden in production) |

### Subscription & Paywall

| Flag | Default | Description |
|------|---------|-------------|
| `subscriptionRequired` | `!__DEV__` | Enforce subscription (auto: off in dev, on in prod) |
| `onboardingPaywall` | `true` | Show paywall at end of onboarding |
| `paywallSavingsCard` | `true` | Savings comparison card on paywall |
| `paywallProfileBanner` | `true` | "Your Profile is Ready!" banner |
| `paywallBenefits` | `false` | Feature benefits list |
| `paywallTrustSignals` | `true` | "Cancel anytime" trust signals |
| `paywallSkipButton` | `false` | Allow skipping paywall |
| `subscriptionSection` | `true` | Subscription management in settings |

### Deep Links & Offers

| Flag | Default | Description |
|------|---------|-------------|
| `deepLinkOffers` | `true` | Deep link offer detection (DeepLinkNow) |
| `trialReminder` | `true` | Push notification before trial expires |

### Adding Your Own Flags

```typescript
// In featureFlags.ts
export const featureFlags = {
  // ...existing flags
  myNewFeature: false,   // Description of what it does
} as const;

// In your component
import { featureFlags } from '../config/featureFlags';

if (featureFlags.myNewFeature) {
  // Feature code
}
```

---

## Examples Tab (Dev Storybook)

The Examples tab is a built-in component showcase, only visible in development (`__DEV__`). It demonstrates the reusable UI patterns you can copy for your own screens.

**Location:** `app/(tabs)/examples.tsx` + `src/examples/`

### Available Examples

| Example | What it shows | Key file |
|---------|--------------|----------|
| **Bottom Sheet Modal** | Simple modal with ModalHeader, save action, dynamic sizing | `src/examples/BottomSheetExample.tsx` |
| **Search Sheet** | Modal with search input, category filter chips, FlatList | `src/examples/SearchSheetExample.tsx` |
| **Wheel Picker** | Time picker using @quidone/react-native-wheel-picker in modal | `src/examples/WheelPickerExample.tsx` |
| **Form Validation** | Inline errors, buttons never disabled, clear-on-type | `src/examples/FormValidationExample.tsx` |
| **Cards** | Card variants (default, elevated), stat cards, list items | `src/examples/CardsExample.tsx` |

### How to Use an Example

1. Open the Examples tab in the app
2. Tap an example to see it in action
3. Copy the source file from `src/examples/` into your feature
4. Adapt the content (data, labels, actions) to your domain

### Bottom Sheet Modal Pattern

All modals follow this structure:

```tsx
<BottomSheetModal
  ref={ref}
  enableDynamicSizing          // Auto-height for short content
  enablePanDownToClose
  backdropComponent={renderBackdrop}
  handleIndicatorStyle={styles.handleIndicator}  // Gray drag bar
  backgroundStyle={styles.sheetBackground}       // Rounded top corners
>
  <BottomSheetView style={styles.contentContainer}>
    <ModalHeader title="Title" onClose={handleClose} onSave={handleSave} />
    <View style={styles.content}>
      {/* Your content */}
    </View>
  </BottomSheetView>
</BottomSheetModal>
```

**Key rules:**
- `BottomSheetView` (not ScrollView) for dynamic sizing
- `ModalHeader` **inside** BottomSheetView
- `paddingBottom: spacing.xxl` on contentContainer for safe area
- For scrollable content: use fixed `snapPoints` + `BottomSheetScrollView` instead

---

## Calendar Feature

A full-stack daily notes calendar with mood tracking. Demonstrates the complete data flow: SQLite → Repository → Store → UI.

**Location:** `app/(tabs)/calendar.tsx` + supporting files

### What it includes

- **Month view** with tappable day cells and status dots
- **Year overview** (12 mini-months grid)
- **Month-to-month navigation** (swipe or arrows)
- **Year-to-year navigation**
- **Day detail sheet** with mood picker (Good/Moderate/Bad) + text note
- **Color-coded days** based on mood (green/orange/red)
- **Legend** with counts per mood category

### Architecture

```
app/(tabs)/calendar.tsx          → Screen (month view + year view)
src/ui/components/YearView.tsx   → Year overview (12 mini-months)
src/ui/components/MiniMonth.tsx  → Single mini-month in year grid
src/ui/components/CalendarLegend.tsx → Color legend with counts
src/ui/sheets/DayDetailSheet.tsx → Modal: mood picker + note editor
src/ui/hooks/useCalendarStore.ts → Zustand store (loads journal entries)
src/data/repositories/journalEntryRepository.ts → SQLite CRUD
src/data/database/schema.ts      → Table definition (journal_entry)
src/domain/models/types.ts       → JournalEntry, MoodType, DayStatus
```

### Data Model

```typescript
type MoodType = 'good' | 'moderate' | 'bad';
type DayStatus = 'good' | 'moderate' | 'bad' | 'no_data';

interface JournalEntry {
  id: number;
  date: string;        // YYYY-MM-DD
  content: string | null;
  mood: MoodType | null;
  createdAt: string;
  updatedAt: string;
}
```

### Adapting the Calendar

To use the calendar for your own domain:

1. **Change the moods/statuses** in `types.ts` — rename or add categories
2. **Update colors** in `src/ui/theme/colors.ts` — map your statuses to colors
3. **Modify the DayDetailSheet** — replace mood picker with your own day editor
4. **Extend the data model** — add fields to `JournalEntry` or create a new table

---

## Project Structure

```
app/                          → Expo Router file-based routes
  (tabs)/                     → Bottom tab screens
    _layout.tsx               → Tab configuration + auth guards
    index.tsx                 → Home screen
    calendar.tsx              → Calendar (daily notes)
    statistics.tsx            → Statistics
    settings.tsx              → Settings
    examples.tsx              → Examples (dev only)
  (modals)/                   → Modal routes
  _layout.tsx                 → Root layout (providers, fonts)
  onboarding.tsx              → Onboarding flow
  subscription-wall.tsx       → Subscription enforcement

src/
  config/                     → Feature flags, environment config
  data/                       → SQLite database + repositories
    database/                 → Connection, schema, migrations
    repositories/             → CRUD operations per entity
  domain/                     → Pure logic, models, constants
    models/types.ts           → All TypeScript interfaces
    utils/                    → Conversion utilities
    services/                 → Domain services
  examples/                   → Example components (dev storybook)
  services/                   → App services (notifications, etc.)
  types/                      → Global type declarations
  ui/
    components/               → Reusable UI components
    hooks/                    → Zustand stores + custom hooks
    sheets/                   → Bottom sheet modals
    theme/                    → Colors, spacing, typography tokens
```

---

## Environment Variables

Required in `.env.local`:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_key
EXPO_PUBLIC_DEEPLINKNOW_API_KEY=your_key
```

---

## Key Technologies

| Technology | Purpose | Docs |
|-----------|---------|------|
| Expo + Expo Router | Framework + file-based navigation | expo.dev |
| TypeScript (strict) | Type safety | typescriptlang.org |
| Zustand | State management | zustand-demo.pmnd.rs |
| SQLite (expo-sqlite) | Local database | docs.expo.dev/versions/latest/sdk/sqlite |
| RevenueCat | Subscriptions (iOS + Android) | revenuecat.com/docs |
| @gorhom/bottom-sheet | iOS-style bottom sheet modals | gorhom.dev/react-native-bottom-sheet |
| victory-native | Charts | commerce.nearform.com/open-source/victory-native |
| @quidone/react-native-wheel-picker | Wheel picker | npm |
| Sentry | Error tracking | docs.sentry.io/platforms/react-native |
| PostHog | Analytics | posthog.com/docs |
| expo-notifications | Push notifications | docs.expo.dev/push-notifications |

---

## Theme System

All styling uses centralized tokens. Never hardcode colors, spacing, or font sizes.

```typescript
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../ui/theme';
```

See `src/ui/theme/` for all available tokens. The Examples tab shows them in action.

---

## Adding a New Feature

1. **Define the data model** in `src/domain/models/types.ts`
2. **Create the DB table** in `src/data/database/schema.ts`
3. **Create a repository** in `src/data/repositories/`
4. **Create or extend a Zustand store** in `src/ui/hooks/`
5. **Build the UI** — screen in `app/`, components in `src/ui/components/`
6. **Add a feature flag** in `src/config/featureFlags.ts`
7. **Add tests** in `__tests__/`
