# Subscription & Paywall Testing Guide

How to test the subscription flow (hard paywall, trial, expiry) across different environments.

## App Subscription Flow

```
New User                          Returning User (Trial Expired)
   |                                    |
   v                                    v
Onboarding (12 steps)             App Launch
   |                                    |
   v                                    v
Hard Paywall                      Subscription Check
(no skip, must subscribe)         (isProUser === false?)
   |                                    |
   v                                    v
Start 7-Day Free Trial            Subscription Wall
   |                              (hard paywall, no dismiss)
   v                                    |
Full App Access                         v
   |                              Start Trial / Subscribe
   v                                    |
Day 5: Reminder Notification            v
"Trial ends in 2 days"           Full App Access
   |
   v
Day 7: Trial Expires
   |
   v
Next App Open -> Subscription Wall
```

---

## Sandbox Testing (Development)

Apple and Google provide sandbox environments where **no real money is charged**.
RevenueCat automatically detects sandbox mode.

### Sandbox Trial Durations

Sandbox subscriptions use accelerated timelines for faster testing:

| Real Duration | iOS Sandbox | Android Test |
|---------------|-------------|--------------|
| 3 days        | 2 minutes   | ~2 minutes   |
| **7 days (our trial)** | **3 minutes** | **~3 minutes** |
| 1 week        | 3 minutes   | 5 minutes    |
| 1 month       | 5 minutes   | 5 minutes    |
| 1 year        | 1 hour      | 30 minutes   |

Sandbox subscriptions auto-renew up to 6 times (iOS) / 12 times (Android), then stop.

### iOS Sandbox Setup

1. **App Store Connect**: Create a Sandbox Tester Account
   - Go to Users and Access > Sandbox > Testers
   - Create a new sandbox Apple ID (use a unique email)
2. **On the test device**:
   - Settings > App Store > Sandbox Account (iOS 14+)
   - Sign in with the sandbox Apple ID
3. **Run the app** via EAS development build (not Expo Go)
4. **Tap "Start Free Trial"** on the paywall
   - Apple shows the sandbox purchase dialog
   - Confirm — no real charge
5. **Wait ~3 minutes** — trial expires in sandbox
6. **Reopen app** — Subscription Wall should appear

### Android Test Setup

1. **Google Play Console**: Add License Testers
   - Settings > License testing > Add email addresses
2. **On the test device**: Sign in with a tester Google account
3. **Run the app** via EAS development build
4. **Purchase flow**: Google shows "Test purchase" dialog — no real charge
5. **Wait ~3 minutes** for trial expiry
6. **Reopen app** — Subscription Wall should appear

### RevenueCat Dashboard

RevenueCat separates sandbox from production transactions:
- Dashboard > Customers: Filter by "Sandbox" to see test purchases
- Each test purchase shows entitlement status, trial dates, renewal events
- Use this to verify the subscription lifecycle works correctly

---

## TestFlight / Internal Testing (Beta)

For beta testers who install via TestFlight (iOS) or Internal Testing (Android):

### How It Works

- **TestFlight users use the SANDBOX environment** — no real charges
- **The purchase dialog clearly says "[Environment: Sandbox]"**
- Trial durations are accelerated (same as sandbox table above)
- Beta testers go through the **exact same flow** as real users, just faster and free

### Beta Tester Flow

```
1. Install via TestFlight / Internal Testing
2. Complete onboarding
3. See Hard Paywall (no skip)
4. Tap "Start Free Trial"
5. Apple/Google sandbox purchase (free)
6. Full app access (~3 min trial)
7. Trial expires -> Subscription Wall appears
8. Can re-subscribe (still free in sandbox)
```

### No Coupons Needed for Testers

You do NOT need to create special coupon codes for beta testers.
The sandbox handles everything automatically. Testers experience
the real purchase flow without being charged.

---

## Testing Scenarios

### Scenario 1: New User — Full Flow

```
1. Fresh install
2. Complete onboarding (12 steps)
3. Hard Paywall appears (no X, no skip)
4. Tap "Start Free Trial"
5. Sandbox purchase dialog -> Confirm
6. App opens with full access
7. Notification permission requested
8. Wait 3 min (sandbox trial)
9. Close and reopen app
10. Subscription Wall appears

Verify:
  [x] Paywall shows correct pricing
  [x] Purchase succeeds (sandbox)
  [x] isProUser becomes true
  [x] All tabs/features accessible
  [x] After trial: Subscription Wall blocks access
  [x] "Restore Purchases" works if already subscribed
```

### Scenario 2: Trial Expiry and Re-subscribe

```
1. Trial expires (3 min in sandbox)
2. Reopen app
3. Subscription Wall appears
4. Tap "Subscribe" (not trial this time)
5. Sandbox purchase -> Confirm
6. App opens with full access

Verify:
  [x] Subscription Wall is not dismissible
  [x] "Restore Purchases" button is available
  [x] New subscription activates immediately
  [x] isProUser becomes true
```

### Scenario 3: Restore Purchases

```
1. User has active subscription
2. Reinstalls app or new device
3. Completes onboarding
4. Sees Hard Paywall
5. Taps "Restore Purchases"
6. Subscription restored

Verify:
  [x] Existing subscription detected
  [x] Redirected to main app
  [x] No additional purchase needed
```

### Scenario 4: Trial Reminder Notification

```
1. User starts trial
2. Notification permission granted
3. In sandbox: notification fires after ~1 min
4. Notification shows: "Your free trial ends soon"

Verify:
  [x] Notification appears when app is backgrounded
  [x] Correct title and body text
  [x] Tapping notification opens the app
```

### Scenario 5: Cancel Subscription

```
1. User has active subscription
2. Settings > Subscription > Manage Subscription
3. Redirected to device subscription management
4. Cancel subscription
5. Access continues until period ends
6. After expiry: Subscription Wall appears

Verify:
  [x] "Manage Subscription" opens correct store settings
  [x] Access maintained until expiry date
  [x] After expiry: hard paywall blocks access
  [x] User data is preserved (drinks, sessions, etc.)
```

---

## Testing the Notification Service

Since the trial reminder fires 2 days before expiry (and sandbox trials are only 3 minutes),
use this approach for testing:

### Quick Test (Development)

Temporarily change the trigger in `notificationService.ts` to fire after 10 seconds:

```typescript
// TEMPORARY - for testing only
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds: 10,
},
```

Remember to revert to the date-based trigger before building for production.

### Verify Scheduled Notifications

```typescript
import * as Notifications from 'expo-notifications';

// Log all scheduled notifications (useful for debugging)
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled);
```

---

## Troubleshooting

### "No packages available" on paywall

- Verify RevenueCat products are configured in the dashboard
- Check that the Offering is set as "Current" in RevenueCat
- Verify product IDs match between App Store Connect / Play Console and RevenueCat
- Check API key is correct for the environment (test vs production)

### Purchase fails in sandbox

**iOS:**
- Sandbox Apple ID signed in on device?
- Products created and "Ready to Submit" in App Store Connect?
- Product IDs match RevenueCat configuration?

**Android:**
- Email added as License Tester in Play Console?
- App signed with correct keystore?
- Products created and activated in Play Console?

### Subscription Wall not appearing after trial

- Check that `useSubscriptionStore.isProUser` is `false`
- Check that `useSubscriptionStore.isLoading` is `false`
- RevenueCat may cache the old state — force refresh with `refreshCustomerInfo()`
- In sandbox, wait the full accelerated trial duration

### Notification not firing

- Notification permissions granted? Check device settings
- On Android: notification channel created?
- App backgrounded? (foreground notifications need `setNotificationHandler`)
- Android battery optimization may delay notifications on some OEMs (Xiaomi, Huawei)
- Use `getAllScheduledNotificationsAsync()` to verify the notification was scheduled

---

## Pre-Launch Checklist

### Sandbox Testing
- [ ] New user flow: onboarding -> paywall -> trial -> app access
- [ ] Trial expiry: subscription wall appears after trial ends
- [ ] Re-subscribe from subscription wall
- [ ] Restore purchases (existing subscriber)
- [ ] Cancel subscription via device settings
- [ ] Trial reminder notification fires
- [ ] "Manage Subscription" in settings opens device store
- [ ] Correct pricing displayed on paywall

### TestFlight / Internal Testing
- [ ] Full flow works on real devices (iOS + Android)
- [ ] Sandbox purchases complete without errors
- [ ] Notification permission prompt appears after purchase
- [ ] Trial reminder notification appears (use 10-sec test trigger)

### Production
- [ ] Switch from sandbox to production API keys
- [ ] Trial length set to 7 days in App Store Connect / Play Console
- [ ] Pricing correct in all target countries
- [ ] Test with a real purchase and immediate refund
- [ ] Verify subscription management links work

---

## Related Documentation

- [REVENUECAT_SETUP.md](./REVENUECAT_SETUP.md) — RevenueCat dashboard configuration
- [REVENUECAT_INTEGRATION.md](./REVENUECAT_INTEGRATION.md) — Code integration details
- [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) — Business strategy and pricing
