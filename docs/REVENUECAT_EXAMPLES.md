# RevenueCat Usage Examples

Quick reference for common RevenueCat integration patterns in the Drink Monitoring app.

## Table of Contents

1. [Basic Pro Access Check](#basic-pro-access-check)
2. [Feature Gating](#feature-gating)
3. [Show Paywall](#show-paywall)
4. [Subscription Status](#subscription-status)
5. [Custom Purchase Flow](#custom-purchase-flow)
6. [Restore Purchases](#restore-purchases)

---

## Basic Pro Access Check

### Simple boolean check

```typescript
import { useIsProUser } from '@/ui/hooks/useSubscriptionStore';

function MyComponent() {
  const isProUser = useIsProUser();

  return (
    <View>
      {isProUser ? (
        <Text>Welcome, Pro user!</Text>
      ) : (
        <Text>Upgrade to unlock more features</Text>
      )}
    </View>
  );
}
```

### Conditional rendering with hook

```typescript
import { useProAccess } from '@/ui/components';

function ExportButton() {
  const { isProUser, navigateToPaywall } = useProAccess();

  const handlePress = () => {
    if (!isProUser) {
      navigateToPaywall();
      return;
    }

    // User has Pro, proceed with export
    exportData();
  };

  return (
    <Button
      title={isProUser ? 'Export Data' : 'Export Data (Pro)'}
      onPress={handlePress}
    />
  );
}
```

---

## Feature Gating

### Component wrapper (recommended)

```typescript
import { ProFeatureGate } from '@/ui/components';

function AdvancedStatsScreen() {
  return (
    <ProFeatureGate featureName="Advanced Statistics">
      <View>
        <Text>Advanced statistics content</Text>
        <DetailedCharts />
        <TrendAnalysis />
      </View>
    </ProFeatureGate>
  );
}
```

### Inline conditional

```typescript
import { useIsProUser } from '@/ui/hooks/useSubscriptionStore';

function StatisticsScreen() {
  const isProUser = useIsProUser();

  return (
    <ScrollView>
      {/* Basic stats - always visible */}
      <BasicStats />

      {/* Pro stats - gated */}
      {isProUser && <AdvancedStats />}
      {isProUser && <TrendAnalysis />}

      {/* Upgrade prompt for non-Pro users */}
      {!isProUser && (
        <ProFeatureGate
          featureName="Advanced Statistics"
          showUpgradePrompt
        >
          <></>
        </ProFeatureGate>
      )}
    </ScrollView>
  );
}
```

### HOC pattern (for entire screens)

```typescript
import { withProFeatureGate } from '@/ui/components';

function ExportScreen() {
  return (
    <View>
      <Text>Export your data</Text>
      {/* Export functionality */}
    </View>
  );
}

// Wrap the entire screen
export default withProFeatureGate(ExportScreen, {
  featureName: 'Data Export',
  redirectOnNoAccess: true, // Auto-redirect to paywall if not Pro
});
```

---

## Show Paywall

### Navigate to paywall from button

```typescript
import { router } from 'expo-router';

function UpgradeButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/(modals)/paywall')}
      style={styles.upgradeButton}
    >
      <Text>Upgrade to Pro</Text>
    </TouchableOpacity>
  );
}
```

### Programmatic paywall with check

```typescript
import { useProAccess } from '@/ui/components';

function FeatureScreen() {
  const { requireProAccess } = useProAccess();

  const handleAdvancedFeature = () => {
    // This will automatically show paywall if user is not Pro
    if (!requireProAccess('Advanced Feature')) {
      return;
    }

    // User has Pro access
    enableAdvancedFeature();
  };

  return (
    <Button title="Use Advanced Feature" onPress={handleAdvancedFeature} />
  );
}
```

### Show paywall on screen mount

```typescript
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useIsProUser } from '@/ui/hooks/useSubscriptionStore';

function ProOnlyScreen() {
  const isProUser = useIsProUser();

  useEffect(() => {
    if (!isProUser) {
      // Redirect to paywall immediately
      router.replace('/(modals)/paywall');
    }
  }, [isProUser]);

  if (!isProUser) {
    return null; // or loading spinner
  }

  return <ProContent />;
}
```

---

## Subscription Status

### Display subscription info

```typescript
import { useSubscriptionStatus, useIsProUser } from '@/ui/hooks/useSubscriptionStore';

function SubscriptionCard() {
  const isProUser = useIsProUser();
  const status = useSubscriptionStatus();

  if (!isProUser) {
    return (
      <Card>
        <Text>Free Plan</Text>
        <Button title="Upgrade" onPress={() => router.push('/(modals)/paywall')} />
      </Card>
    );
  }

  return (
    <Card>
      <Text>Pro Plan</Text>
      {status?.isLifetime ? (
        <Text>Lifetime Access</Text>
      ) : status?.expirationDate ? (
        <Text>Expires: {new Date(status.expirationDate).toLocaleDateString()}</Text>
      ) : (
        <Text>Active Subscription</Text>
      )}
      <Button
        title="Manage Subscription"
        onPress={() => router.push('/(modals)/customer-center')}
      />
    </Card>
  );
}
```

### Check specific product

```typescript
import { useCustomerInfo } from '@/ui/hooks/useSubscriptionStore';

function SubscriptionInfo() {
  const customerInfo = useCustomerInfo();

  const hasLifetime = customerInfo?.entitlements.active['Drink monitoring Pro']
    ?.productIdentifier === 'lifetime';

  const hasYearly = customerInfo?.entitlements.active['Drink monitoring Pro']
    ?.productIdentifier === 'yearly';

  return (
    <View>
      {hasLifetime && <Text>🌟 Lifetime Member</Text>}
      {hasYearly && <Text>🎯 Annual Subscriber</Text>}
    </View>
  );
}
```

---

## Custom Purchase Flow

### Manual package selection

```typescript
import { useState, useEffect } from 'react';
import { getOfferings, purchasePackage } from '@/services/revenueCatService';
import { useSubscriptionStore } from '@/ui/hooks/useSubscriptionStore';
import type { PurchasesPackage } from 'react-native-purchases';

function CustomPaywall() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshCustomerInfo = useSubscriptionStore(
    (state) => state.refreshCustomerInfo
  );

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    const offering = await getOfferings();
    if (offering) {
      setPackages(offering.availablePackages);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setLoading(true);
    try {
      await purchasePackage(pkg);
      await refreshCustomerInfo();
      Alert.alert('Success', 'Thank you for subscribing!');
      router.back();
    } catch (error: any) {
      if (error.message !== 'PURCHASE_CANCELLED') {
        Alert.alert('Error', 'Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {packages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          onPress={() => handlePurchase(pkg)}
          disabled={loading}
        >
          <Text>{pkg.product.title}</Text>
          <Text>{pkg.product.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### With intro pricing check

```typescript
import { useState, useEffect } from 'react';
import { getOfferings, isEligibleForIntro } from '@/services/revenueCatService';
import type { PurchasesPackage } from 'react-native-purchases';

function PaywallWithIntro() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [eligibility, setEligibility] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const offering = await getOfferings();
    if (offering) {
      setPackages(offering.availablePackages);

      // Check intro pricing eligibility
      const productIds = offering.availablePackages.map(
        (p) => p.product.identifier
      );
      const eligible = await isEligibleForIntro(productIds);
      setEligibility(eligible);
    }
  };

  return (
    <View>
      {packages.map((pkg) => (
        <View key={pkg.identifier}>
          <Text>{pkg.product.title}</Text>
          <Text>{pkg.product.priceString}</Text>
          {eligibility[pkg.product.identifier] && (
            <Text style={styles.badge}>FREE TRIAL AVAILABLE</Text>
          )}
        </View>
      ))}
    </View>
  );
}
```

---

## Restore Purchases

### Simple restore button

```typescript
import { useState } from 'react';
import { useSubscriptionStore } from '@/ui/hooks/useSubscriptionStore';

function RestoreButton() {
  const [loading, setLoading] = useState(false);
  const restorePurchases = useSubscriptionStore(
    (state) => state.restorePurchases
  );

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleRestore} disabled={loading}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text>Restore Purchases</Text>
      )}
    </TouchableOpacity>
  );
}
```

### With success callback

```typescript
import { restorePurchases } from '@/services/revenueCatService';
import { useSubscriptionStore } from '@/ui/hooks/useSubscriptionStore';

function RestoreFlow() {
  const refreshCustomerInfo = useSubscriptionStore(
    (state) => state.refreshCustomerInfo
  );

  const handleRestore = async () => {
    try {
      const customerInfo = await restorePurchases();
      await refreshCustomerInfo();

      // Check if any active entitlements
      const hasActiveEntitlement =
        Object.keys(customerInfo.entitlements.active).length > 0;

      if (hasActiveEntitlement) {
        Alert.alert(
          'Restored!',
          'Your Pro subscription has been restored.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No active subscriptions were found for this account.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    }
  };

  return <Button title="Restore Purchases" onPress={handleRestore} />;
}
```

---

## Advanced Patterns

### Listen to subscription changes

```typescript
import { useEffect } from 'react';
import { useSubscriptionStore } from '@/ui/hooks/useSubscriptionStore';

function MyApp() {
  const isProUser = useIsProUser();

  useEffect(() => {
    if (isProUser) {
      // User just became Pro - unlock features
      console.log('Pro access granted!');
      enableProFeatures();
    } else {
      // User lost Pro access - lock features
      console.log('Pro access revoked');
      disableProFeatures();
    }
  }, [isProUser]);

  return <AppContent />;
}
```

### Conditional navigation based on Pro status

```typescript
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useIsProUser } from '@/ui/hooks/useSubscriptionStore';

function ProtectedScreen() {
  const isProUser = useIsProUser();

  useEffect(() => {
    if (!isProUser) {
      // Redirect non-Pro users
      router.replace('/(tabs)');

      // Show paywall after redirect
      setTimeout(() => {
        router.push('/(modals)/paywall');
      }, 100);
    }
  }, [isProUser]);

  if (!isProUser) {
    return <ActivityIndicator />;
  }

  return <ProContent />;
}
```

### Feature flags with Pro access

```typescript
import { useIsProUser } from '@/ui/hooks/useSubscriptionStore';

const FEATURES = {
  EXPORT: 'export',
  ADVANCED_STATS: 'advanced_stats',
  CLOUD_SYNC: 'cloud_sync',
  UNLIMITED_HISTORY: 'unlimited_history',
} as const;

function useFeatureAccess() {
  const isProUser = useIsProUser();

  const hasAccess = (feature: string): boolean => {
    // Some features are always free
    if (feature === FEATURES.EXPORT && __DEV__) {
      return true; // Allow in development
    }

    // Pro features
    const proFeatures = [
      FEATURES.ADVANCED_STATS,
      FEATURES.CLOUD_SYNC,
      FEATURES.UNLIMITED_HISTORY,
    ];

    if (proFeatures.includes(feature)) {
      return isProUser;
    }

    // Default to free
    return true;
  };

  return { hasAccess, isProUser };
}

// Usage
function ExportButton() {
  const { hasAccess } = useFeatureAccess();

  if (!hasAccess(FEATURES.EXPORT)) {
    return null;
  }

  return <Button title="Export" onPress={exportData} />;
}
```

---

## Tips & Best Practices

1. **Always refresh after purchases:**
   ```typescript
   await purchasePackage(pkg);
   await refreshCustomerInfo(); // Important!
   ```

2. **Handle cancellation gracefully:**
   ```typescript
   try {
     await purchasePackage(pkg);
   } catch (error: any) {
     if (error.message === 'PURCHASE_CANCELLED') {
       // Don't show error - user cancelled intentionally
       return;
     }
     Alert.alert('Error', 'Purchase failed');
   }
   ```

3. **Use component gating over manual checks:**
   ```typescript
   // Good ✅
   <ProFeatureGate featureName="Export">
     <ExportView />
   </ProFeatureGate>

   // Less ideal ⚠️
   {isProUser && <ExportView />}
   ```

4. **Provide value in upgrade prompts:**
   ```typescript
   <ProFeatureGate
     featureName="Advanced Statistics"
     customPrompt={
       <View>
         <Text>📊 See detailed trends</Text>
         <Text>📈 Track long-term patterns</Text>
         <Text>📉 Compare weekly/monthly data</Text>
         <Button title="Upgrade Now" />
       </View>
     }
   >
     <AdvancedStats />
   </ProFeatureGate>
   ```

---

## Quick Reference

| Task | Code |
|------|------|
| Check Pro status | `const isPro = useIsProUser()` |
| Show paywall | `router.push('/(modals)/paywall')` |
| Manage subscription | `router.push('/(modals)/customer-center')` |
| Gate feature | `<ProFeatureGate>{content}</ProFeatureGate>` |
| Restore purchases | `await restorePurchases()` |
| Get offerings | `await getOfferings()` |
| Purchase package | `await purchasePackage(pkg)` |
| Refresh status | `await refreshCustomerInfo()` |

---

## Need Help?

- Check [REVENUECAT_INTEGRATION.md](./REVENUECAT_INTEGRATION.md) for detailed setup
- See [RevenueCat docs](https://www.revenuecat.com/docs) for SDK reference
- Look at [app/(modals)/paywall.tsx](../app/(modals)/paywall.tsx) for complete example
