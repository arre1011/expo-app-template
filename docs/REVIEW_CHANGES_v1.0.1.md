# App Store Review Changes - v1.0.1

This document summarizes all changes made in response to the App Store review rejection (January 20, 2026).

---

## Guideline 2.3.8 - App Name Mismatch

**Issue:** Marketplace app name ("GlassCount") did not match device name ("Drink Tracker").

**Changes Made:**
| Location | Before | After |
|----------|--------|-------|
| `app.json` → `name` | Drink Tracker | GlassCount |
| App Store Connect → Name | GlassCount | GlassCount (unchanged) |
| App Store Connect → Subtitle | Track Drinks & Estimate BAC | Mindful Drink Tracker |

**Result:** Both names now match "GlassCount".

---

## Guideline 2.1 - iPad Continue Button Bug

**Issue:** "Continue" button was unresponsive on iPad Air 11-inch (M3).

### Root Cause Found
The "Continue" button on the Sex Selection screen had validation logic but **no visible error message**. When tapped without a selection, nothing appeared to happen (button seemed unresponsive).

### Changes Made

**1. Code Fix (`app/onboarding.tsx`):**
- Added visible error message when no sex is selected
- Error text now appears below the options: "Please select an option to continue"
- Uses existing `errorText` style with center alignment

**2. iPad Support:**
- `app.json` already had `"supportsTablet": false`
- App is designed for iPhone only
- Device compatibility determined by build configuration

### Best Practice Applied
- **No default selection** for biological sex (UX best practice for personal data)
- Clear validation message explains what's needed
- Non-judgmental wording

**Result:** Button now provides clear feedback. iPad will not be supported after new build.

---

## Guideline 1.4 - Physical Harm (BAC Calculator)

**Issue:** App was marketed as a BAC calculator without associated hardware.

### App Store Connect Changes

| Location | Before | After |
|----------|--------|-------|
| Subtitle | Track Drinks & Estimate BAC | Mindful Drink Tracker |

### Promotional Text

**Before:**
> Track your drinks privately. Estimate BAC in real-time. Set personal limits. All data stays on your device — no account needed.

**After:**
> Track your drinks mindfully. Set personal limits. Build awareness of your habits. All data stays on your device — no account needed.

### Description Changes

**Opening paragraph - Before:**
> GlassCount helps you track your alcohol consumption mindfully. Log your drinks, estimate your Blood Alcohol Concentration (BAC), and set personal limits...

**Opening paragraph - After:**
> GlassCount helps you track your alcohol consumption mindfully. Log your drinks, set personal goals, and build awareness of your drinking habits — all while keeping your data completely private on your device.

**Feature list change:**
| Before | After |
|--------|-------|
| Real-Time BAC Estimate - See your estimated blood alcohol concentration update as you log drinks. | Drink Awareness - See how your drinks add up throughout the evening. |

**How it works change:**
| Before | After |
|--------|-------|
| 3. Watch your estimated BAC in real-time | 3. Track your consumption throughout the session |

### Keywords

**Before:**
> alcohol,bac,tracker,drink,drinking,sober,limit,health,mindful,calculator

**After:**
> alcohol,tracker,drink,drinking,sober,limit,health,mindful,awareness,wellness

(Removed: `bac`, `calculator`)

### Clarification for Reviewer
- This app is a **drink tracking app for mindful drinking**, not a BAC calculator
- BAC is shown as an **informational estimate only**, similar to other approved apps (e.g., "Alkomat")
- Prominent disclaimers throughout the app: "Estimates only - not for driving decisions"
- Focus is on harm reduction and awareness, not BAC measurement

**Awaiting Apple's response** on what additional changes may be needed.

---

## Files Changed

| File | Change |
|------|--------|
| `app.json` | `name`: "Drink Tracker" → "GlassCount" |
| `app/onboarding.tsx` | Added visible error message for sex selection validation |
| App Store Connect | Subtitle, Promotional Text, Description, Keywords updated |

---

## Review Notes for Submission

Include in App Review Information:

> Changes made in response to rejection:
> 1. App name now matches on device and store (GlassCount)
> 2. iPad disabled - app is iPhone only
> 3. Subtitle changed to emphasize drink tracking over BAC
>
> This app is a mindful drink tracker, not a BAC calculator. BAC is shown as informational estimates only with clear disclaimers throughout.

---

*Last updated: January 20, 2026*