# Paywall Strategies Research

> Research conducted: January 2026
> Sources: RevenueCat, Adapty, Business of Apps, Superwall, and industry case studies

## Executive Summary

This document analyzes different paywall strategies for the GlassCount app, comparing conversion rates, implementation effort, and best practices based on industry research and benchmarks.

**Key Finding:** A hard paywall with 14-day free trial + trial expiration notifications achieves the best balance of conversion rate (7-9%) and implementation effort.

---

## Industry Benchmarks (2025-2026)

| Metric | Median | Top 25% Apps | Top 10% Apps |
|--------|--------|--------------|--------------|
| Install → Trial | 3-5% | 8-15% | 15%+ |
| Trial → Paid | 38% | 60%+ | 70%+ |
| Install → Paid (30 days) | 1.7% | 4.2% | 7%+ |

### By Paywall Type

| Paywall Type | Install → Trial | Trial → Paid | Notes |
|--------------|-----------------|--------------|-------|
| Hard Paywall | 12.11% | 44-45% | Highest immediate conversion |
| Soft Paywall (Skip) | 8-10% | 40-45% | Lower trial starts |
| Freemium | 2.18% | 38% | Larger user base, lower conversion |
| Contextual (Feature-gated) | 10-15% | 50%+ | Highest intent users |

### By Trial Length

| Trial Length | Trial → Paid | Cancellation Rate |
|--------------|--------------|-------------------|
| 3 days | 30% | 26% |
| 7 days | 45% | 35% |
| 14 days | 44-45% | 42% |
| 30 days | 45-56% | 51% |

**Insight:** 14-day trials offer the best balance - long enough to show value, short enough to maintain urgency.

---

## Strategy Comparison

### Strategy A: Hard Paywall After Onboarding (14-Day Trial)

```
Onboarding → Hard Paywall (no skip) → Trial starts or user leaves
```

**Conversion Rates:**
- Install → Trial: **12-15%**
- Trial → Paid: **44-45%**
- **Install → Paid: ~5-7%**

**Pros:**
- Highest immediate trial conversion
- Simple implementation
- Users who convert are highly engaged
- 82% of trial starts happen on Day 0

**Cons:**
- 57% of users leave when seeing paywall
- Miss opportunity to show app value
- 80-90% of users lost immediately

**Research Quote:**
> "Hard paywalls convert downloads to paid at 12.11% vs 2.18% for freemium" - RevenueCat 2025

---

### Strategy B: Hard Paywall + Skip → Paywall After 1 Drink

```
Onboarding → Soft Paywall (skip possible) → 1 drink free → Hard Paywall
```

**Conversion Rates:**
- Install → Trial (onboarding): ~8%
- Install → Trial (after drink): +3-5% additional
- Trial → Paid: ~40-45%
- **Install → Paid: ~4-5%**

**Pros:**
- Users experience app value first ("Aha moment")
- Lower complaint rate
- Builds trust before asking for payment

**Cons:**
- More complex implementation
- Some users never convert (only use 1 free drink)
- Slightly lower overall conversion

**Research Quote:**
> "Post-onboarding paywalls (value first) achieve 37-40% trial conversion vs 25-30% for immediate paywalls" - AppAgent

---

### Strategy C: Strategy B + Trial Expiration Notifications

```
Same as B + Push notifications 3 days and 1 day before trial ends
```

**Conversion Rate Improvement:**
- Trial → Paid: **+23-30%** improvement
- From 45% → **55-60%**
- User LTV: **+45%** higher

**Case Study - Blinkist:**
> "Blinkist started sending push notifications to remind users their trial was ending. Result: higher trial start rate, engagement rate, AND conversion rate. Complaints dropped by 55%."

**Optimal Notification Timing:**
| Day | Message |
|-----|---------|
| Day 11 | "Your free trial ends in 3 days" |
| Day 13 | "Last day of your free trial" |
| Day 14 | "Your trial ends today" (optional) |

---

### Strategy D: Hard Paywall + Trial Notifications (Recommended)

```
Onboarding → Hard Paywall → Trial + Notifications at Day 11 & 13
```

**Conversion Rates:**
- Install → Trial: **12-15%** (hard paywall)
- Trial → Paid: **55-60%** (with notifications)
- **Install → Paid: ~7-9%**

**This is 4-5x better than the industry median (1.7%)**

**Pros:**
- Best combination of high trial rate + high conversion
- Simple implementation
- Users feel fairly treated (transparency)
- Fewer negative reviews

---

### Strategy E: Gold Standard (Full Optimization)

```
┌─────────────────────────────────────────────────────────────────┐
│  GOLD STANDARD PAYWALL FLOW                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ONBOARDING (3-5 Screens)                                    │
│     └→ Personalization + value communication                    │
│                                                                 │
│  2. PAYWALL #1 (Semi-Hard)                                      │
│     └→ "Start 14-day free trial"                                │
│     └→ Skip button (small but visible)                          │
│     └→ Checkbox: "Remind me before trial ends"                  │
│                                                                 │
│  3. APP USAGE (1-2 drinks)                                      │
│     └→ User experiences value                                   │
│                                                                 │
│  4. PAYWALL #2 (Contextual)                                     │
│     └→ When trying to add 2nd/3rd drink                         │
│     └→ "Enjoying the app? Start your trial now"                 │
│     └→ Personalized based on first drink                        │
│                                                                 │
│  5. TRIAL NOTIFICATIONS                                         │
│     └→ Day 11: "3 days remaining"                               │
│     └→ Day 13: "Your trial ends tomorrow"                       │
│                                                                 │
│  6. WINBACK (Optional)                                          │
│     └→ On cancellation: Discount offer                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Conversion Rates:**
- Install → Trial: **15-20%** (multiple touchpoints)
- Trial → Paid: **60%+** (notifications + engagement)
- **Install → Paid: ~10-12%**

---

## Additional Optimization Techniques

| Technique | Conversion Uplift | Source |
|-----------|-------------------|--------|
| Animated paywall elements | +15-20% | Apphud |
| 2-3 pricing options (not just 1) | +44-61% | RevenueCat |
| Personalized paywall | +15%+ | SingleGrain |
| Discount on rejection | +20% | RevenueCat |
| Dynamic/time-based offers | +35% | SingleGrain |
| "Honest Paywall" (full transparency) | +23% conversion, -55% complaints | Blinkist |

### Pricing Options Impact

| Number of Plans | Conversion vs. 1 Plan |
|-----------------|----------------------|
| 1 plan | Baseline |
| 2 plans | +61% |
| 3 plans | +105% (vs. 1 plan) |

---

## Implementation Effort Comparison

| Strategy | Effort | Time | Files Changed |
|----------|--------|------|---------------|
| A: Hard Paywall (remove skip) | Very Low | 5 min | 1 |
| B: Paywall after drink | Medium | 2-3h | 3-4 |
| C: B + Notifications | Medium | 3-4h | 5-6 |
| D: Hard + Notifications | Low | 1-2h | 2-3 |
| E: Full Gold Standard | High | 4-6h | 6-8 |

---

## Ethical Considerations

### Showing Paywall to Users Who've Been Drinking

**Concern:** Users may have consumed alcohol when seeing the paywall after their first drink.

**Mitigations:**
1. **14-day free trial** - No payment decision while potentially impaired
2. **Trial notifications** - User can review decision when sober
3. **Easy cancellation** - Can cancel anytime in device settings
4. **Transparency** - Clear messaging about trial terms

**Legal Context:**
- EU Digital Services Act prohibits "dark patterns" that exploit impaired judgment
- FTC monitors subscription sign-ups for manipulative practices
- Apple App Store requires clear pricing disclosure

**Recommendation:** The 14-day free trial with notifications is ethically sound because:
- No immediate payment required
- User has 14 days to make sober decision
- Reminder notifications build trust

---

## Trial Expiration Notifications

### Does Apple Send Automatic Reminders?

**No.** Apple does NOT send trial expiration reminders to users.

> "Users need to cancel the subscription themselves. Apple advises: cancel at least 24 hours before the trial ends." - Apple Support

Apple only sends notifications for **price changes**, not trial expirations.

### Implementation Options

| Method | Effort | Pros | Cons |
|--------|--------|------|------|
| Local Push Notifications | Low | No backend needed, works offline | Requires permission |
| In-app Banner | Very Low | No permissions needed | User must open app |
| RevenueCat Webhooks | Medium | Reliable, server-side | Requires backend |
| Email | High | Works if app not opened | Need email collection |

**Recommended:** Local push notifications via `expo-notifications` (already installed)

### Notification Copy Examples

**Day 11 (3 days before):**
```
Title: Your free trial ends in 3 days
Body: Keep tracking your drinks mindfully! Tap to manage your subscription.
```

**Day 13 (1 day before):**
```
Title: Last day of your free trial
Body: Your trial ends tomorrow. We hope you enjoyed GlassCount!
```

---

## Recommendation for GlassCount MVP

### Immediate Implementation (Strategy D)

**Effort:** ~2 hours
**Expected Conversion:** 7-9% install-to-paid

**Steps:**
1. Remove "Skip for now" button from paywall (5 min)
2. Add trial expiration notifications (1-2h)
3. Add "Remind me" checkbox on paywall (30 min)
4. Update legal text for transparency (15 min)

### Post-MVP Improvements

| Phase | Feature | Expected Uplift |
|-------|---------|-----------------|
| v1.1 | Paywall after 1st drink (contextual) | +10-15% |
| v1.2 | Animated paywall elements | +15-20% |
| v1.3 | Discount on trial cancellation | +20% |
| v1.4 | A/B testing framework | +30-50% (iterative) |

---

## Key Takeaways

1. **Hard paywalls convert better** than soft paywalls (12% vs 8%)
2. **Trial notifications increase Trial→Paid by 23-30%**
3. **14-day trials** are optimal for our use case
4. **Transparency reduces complaints by 55%** (Blinkist case)
5. **Multiple touchpoints** increase total conversion
6. **Local notifications** require no backend

---

## Sources

- [RevenueCat: State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- [RevenueCat: Hard vs Soft Paywalls](https://www.revenuecat.com/blog/growth/hard-paywall-vs-soft-paywall/)
- [RevenueCat: Paywall Placement Guide](https://www.revenuecat.com/blog/growth/paywall-placement/)
- [Business of Apps: Trial Benchmarks 2026](https://www.businessofapps.com/data/app-subscription-trial-benchmarks/)
- [Adapty: Trial Conversion Rates](https://adapty.io/blog/trial-conversion-rates-for-in-app-subscriptions/)
- [Adapty: iOS Paywall Design Guide](https://adapty.io/blog/how-to-design-ios-paywall/)
- [Superwall: Free Trial Reminders](https://superwall.com/features/free-trial-reminders)
- [AppAgent: Paywall Optimization](https://appagent.com/blog/mobile-app-onboarding-5-paywall-optimization-strategies/)
- [Apphud: High-Converting Paywalls](https://apphud.com/blog/design-high-converting-subscription-app-paywalls)
- [Apple Developer: Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [ACM: Dark UX Patterns Case Study](https://www.acm.org/code-of-ethics/case-studies/dark-ux-patterns)
