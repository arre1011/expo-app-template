# RevenueCat Quick Reference

One-page reference for common tasks and code snippets.

## 🚀 Quick Actions

```typescript
// Check if user has Pro
import { useIsProUser } from '@/ui/hooks/useSubscriptionStore';
const isProUser = useIsProUser();

// Show paywall
import { router } from 'expo-router';
router.push('/(modals)/paywall');

// Gate a feature
import { ProFeatureGate } from '@/ui/components';
<ProFeatureGate featureName="Feature Name">
  <YourComponent />
</ProFeatureGate>

// Check access in function
import { useProAccess } from '@/ui/components';
const { requireProAccess } = useProAccess();
if (!requireProAccess('Feature')) return;
```

## 📦 Configuration

**API Key:** `src/services/revenueCatService.ts:15`
```typescript
const API_KEY = 'test_RIYJBdoDAPQadpVSUJeJekGGsDx'; // Update for production
```

**Entitlement:** `Drink monitoring Pro`

**Products:** `monthly`, `yearly`, `lifetime`

## 🔗 Navigation

```typescript
// Paywall
router.push('/(modals)/paywall');

// Customer Center
router.push('/(modals)/customer-center');

// Settings (has subscription section)
router.push('/(tabs)/settings');
```

## 🎯 Common Patterns

### 1. Conditional Rendering

```typescript
const isProUser = useIsProUser();
return isProUser ? <ProUI /> : <FreeUI />;
```

### 2. Feature Button

```typescript
const { requireProAccess } = useProAccess();

<Button
  title="Export"
  onPress={() => {
    if (requireProAccess('Export')) {
      exportData();
    }
  }}
/>
```

### 3. Component Wrapper

```typescript
<ProFeatureGate featureName="Export">
  <ExportView />
</ProFeatureGate>
```

### 4. Get Subscription Details

```typescript
const status = useSubscriptionStatus();
// status.isLifetime
// status.expirationDate
// status.productIdentifier
```

## 🛠️ Testing

**Console Check:**
```
✅ RevenueCat initialized successfully
```

**Test Flow:**
1. Settings → "Upgrade zu Pro"
2. Verify paywall shows packages
3. Test purchase (sandbox)
4. Verify Pro status updates
5. Restart app → Pro status persists
6. Reinstall → "Restore Purchases" → Pro restored

## 📱 Sandbox Setup

**iOS:**
- App Store Connect → Users and Access → Sandbox Testers
- Add test account
- Sign out on device, sign in with sandbox account

**Android:**
- Play Console → Setup → License Testing
- Add test email
- Use signed APK on test device

## 🔧 Service Methods

```typescript
import {
  initializeRevenueCat,
  hasProAccess,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getSubscriptionStatus,
} from '@/services/revenueCatService';

// Check Pro (async)
const isPro = await hasProAccess();

// Get packages
const offering = await getOfferings();

// Purchase
await purchasePackage(package);

// Restore
await restorePurchases();

// Get status
const status = await getSubscriptionStatus();
```

## 🎨 UI Components

**Paywall:**
- `app/(modals)/paywall.tsx`
- Uses `PaywallFooterContainerView`
- Auto-handles purchases

**Customer Center:**
- `app/(modals)/customer-center.tsx`
- Uses `CustomerCenterView`
- Subscription management

**Pro Gate:**
- `src/ui/components/ProFeatureGate.tsx`
- Wrapper component
- HOC pattern
- Hook: `useProAccess()`

## 📋 Checklist Before Production

- [ ] Products created in RevenueCat Dashboard
- [ ] Products created in App Store Connect (iOS)
- [ ] Products created in Play Console (Android)
- [ ] Entitlement created: `Drink monitoring Pro`
- [ ] Offering created and set as current
- [ ] Service credentials uploaded (App Store API key, Play JSON)
- [ ] API key updated to production
- [ ] Sandbox testing completed
- [ ] TestFlight/Internal testing completed

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| No packages | Verify offering is "Current" in dashboard |
| Purchase fails | Check product IDs match exactly |
| Not initialized | Check console for initialization error |
| Restore fails | Ensure previous purchase exists |
| Entitlement not unlocking | Verify products attached to entitlement |

## 📚 Documentation

- **Setup:** `docs/REVENUECAT_SETUP.md`
- **Integration:** `docs/REVENUECAT_INTEGRATION.md`
- **Examples:** `docs/REVENUECAT_EXAMPLES.md`
- **Summary:** `REVENUECAT_SUMMARY.md`

## 🔑 Key Files

```
src/services/revenueCatService.ts       - Service layer
src/ui/hooks/useSubscriptionStore.ts    - State management
src/ui/components/ProFeatureGate.tsx    - Feature gating
app/(modals)/paywall.tsx                - Paywall UI
app/(modals)/customer-center.tsx        - Subscription management
app/(tabs)/settings.tsx                 - Settings integration
```

## 💡 Pro Tips

1. **Always refresh after purchase:**
   ```typescript
   await purchasePackage(pkg);
   await refreshCustomerInfo();
   ```

2. **Handle cancellation gracefully:**
   ```typescript
   if (error.message === 'PURCHASE_CANCELLED') return;
   ```

3. **Use hooks over direct calls:**
   ```typescript
   const isProUser = useIsProUser(); // ✅
   const isPro = await hasProAccess(); // ⚠️ Only in async functions
   ```

4. **Gate features, not entire screens:**
   ```typescript
   <ProFeatureGate featureName="Export">
     <ExportButton />
   </ProFeatureGate>
   ```

## 🌐 Useful Links

- [Dashboard](https://app.revenuecat.com)
- [Docs](https://www.revenuecat.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Play Console](https://play.google.com/console)

---

**Need more details?** See the full documentation in `docs/` folder.
