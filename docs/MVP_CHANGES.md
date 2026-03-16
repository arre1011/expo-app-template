# MVP Release Changes

This document tracks all features that are commented out or modified for the initial App Store / Google Play Store MVP release.

**Purpose:** Submit a minimal but functional app to trigger the initial review process and get early feedback on store compliance.

**Date:** 2025-01-17

---

## Summary of Disabled Features

| Feature | File | Status |
|---------|------|--------|
| Calendar Tab | `app/(tabs)/_layout.tsx` | DISABLED |
| Statistics Tab | `app/(tabs)/_layout.tsx` | DISABLED |
| Past Sessions List | `app/(tabs)/index.tsx` | DISABLED |
| BACChartVictory (second chart) | `app/(tabs)/index.tsx` | DISABLED |
| Paywall non-MVP features | `app/onboarding.tsx` | MODIFIED |
| Paywall non-MVP features | `app/(modals)/paywall-enhanced.tsx` | MODIFIED |
| Paywall non-MVP features | `app/(modals)/paywall.tsx` | MODIFIED |

---

## Detailed Changes

### 1. Tab Navigation (`app/(tabs)/_layout.tsx`)

**Disabled:**
- Calendar tab (lines 32-40)
- Statistics tab (lines 41-50)

**Result:** Only "Session" and "Settings" tabs visible.

```tsx
// MVP: Calendar tab disabled
{/* <Tabs.Screen
  name="calendar"
  options={{
    title: 'Calendar',
    headerShown: false,
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="calendar-outline" size={size} color={color} />
    ),
  }}
/> */}

// MVP: Statistics tab disabled
{/* <Tabs.Screen
  name="statistics"
  options={{
    title: 'Statistics',
    headerShown: false,
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="stats-chart-outline" size={size} color={color} />
    ),
  }}
/> */}
```

---

### 2. Home Screen - Past Sessions (`app/(tabs)/index.tsx`)

**Disabled:**
- Past Sessions section in empty state (lines 222-249)
- Past Sessions section in active state (lines 331-358)
- BACChartVictory component (second chart, lines 310-315)

**Why:** Session history is buggy and needs more testing.

```tsx
// MVP: Past Sessions disabled (in empty state)
{/* {pastSessions.length > 0 && (
  <View style={styles.pastSessionsSection}>
    ...
  </View>
)} */}

// MVP: BACChartVictory disabled
{/* {bacTimeSeries && bacTimeSeries.dataPoints.length > 0 && (
  <View style={styles.chartSection}>
    <BACChartVictory timeSeries={bacTimeSeries} />
  </View>
)} */}
```

---

### 3. Paywall - Onboarding (`app/onboarding.tsx`)

**Modified Features List (lines 731-737):**

Remove or modify features that are not in MVP:
- ~~"Detailed Statistics"~~ → Remove (Statistics not in MVP)
- ~~"Unlimited History"~~ → Remove (Calendar/History not in MVP)
- ~~"Export Your Data"~~ → Remove (Not implemented)

**Keep:**
- "Real-time BAC Tracking"
- "Personal BAC Limits"

---

### 4. Paywall Enhanced (`app/(modals)/paywall-enhanced.tsx`)

**Modified Features List (lines 252-258):**

Same changes as onboarding paywall - remove features not in MVP.

---

### 5. Paywall Basic (`app/(modals)/paywall.tsx`)

**Modified Features List (lines 168-199):**

Remove or modify:
- ~~"Advanced Statistics"~~ → Remove
- ~~"Extended History"~~ → Remove
- ~~"Export Data"~~ → Remove
- ~~"Smart Reminders"~~ → Remove
- ~~"Cloud Sync"~~ → Remove

---

## Files to Verify Before Release

- [x] `app/(tabs)/_layout.tsx` - Tabs disabled
- [x] `app/(tabs)/index.tsx` - Past sessions & second chart disabled
- [x] `app/onboarding.tsx` - Paywall features updated
- [x] `app/(modals)/paywall-enhanced.tsx` - Features updated
- [x] `app/(modals)/paywall.tsx` - Features updated

**All tests passed: 163/163**

---

## How to Restore for Full Release

1. Search for `// MVP:` comments in the codebase
2. Uncomment all disabled sections
3. Restore original feature lists in paywall screens
4. Run full test suite: `npm test`
5. Test Calendar and Statistics functionality manually

---

## What's Included in MVP

### Core Features (Working)
- Onboarding flow (profile setup, goal selection)
- Drink logging with quick-add
- Real-time BAC estimation
- BAC chart visualization (single chart only)
- Goal/limit warnings
- Settings (profile, units, subscription)

### Subscription/Paywall
- RevenueCat integration
- Free trial flow
- Restore purchases

### Legal/Compliance
- Privacy Policy
- Terms of Service
- BAC disclaimer ("estimates only - not for driving decisions")
