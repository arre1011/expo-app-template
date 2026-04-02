/**
 * Subscription Store
 * Manages subscription state and Pro access throughout the app
 */

import { create } from 'zustand';
import {
  ENTITLEMENT_ID,
  initializeRevenueCat,
  getCustomerInfo,
  hasProAccess,
  invalidateCustomerInfoCache,
  restorePurchases,
  addCustomerInfoUpdateListener,
  type SubscriptionCustomerInfo,
} from '@/infrastructure/subscriptions';
import { featureFlags } from '@/config/featureFlags';

/** Extract Pro status and subscription details from RevenueCat customer info */
function extractSubscriptionState(info: SubscriptionCustomerInfo) {
  const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  const status = entitlement ? {
    isActive: true,
    productIdentifier: entitlement.productIdentifier,
    expirationDate: entitlement.expirationDate || undefined,
    willRenew: entitlement.willRenew,
    isLifetime: entitlement.expirationDate === null,
  } : { isActive: false };

  return { isPro, status };
}

interface SubscriptionState {
  // State
  isProUser: boolean;
  isLoading: boolean;
  customerInfo: SubscriptionCustomerInfo | null;
  subscriptionStatus: {
    isActive: boolean;
    productIdentifier?: string;
    expirationDate?: string;
    willRenew?: boolean;
    isLifetime?: boolean;
  } | null;

  // Actions
  initialize: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  updateFromCustomerInfo: (info: SubscriptionCustomerInfo) => void;
  restorePurchases: () => Promise<void>;
  checkProAccess: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
  // Set up customer info listener
  let cleanupListener: (() => void) | null = null;

  // Prevent multiple simultaneous refresh calls
  let isRefreshing = false;

  return {
    // Initial state
    isProUser: false,
    isLoading: true,
    customerInfo: null,
    subscriptionStatus: null,

    // Initialize RevenueCat and load customer info
    initialize: async () => {
      if (!featureFlags.revenueCat) {
        set({ isLoading: false, isProUser: false });
        console.log('ℹ️ RevenueCat disabled via feature flag — skipping initialization');
        return;
      }

      set({ isLoading: true });

      try {
        // Initialize SDK
        await initializeRevenueCat();

        // Load customer info
        await get().refreshCustomerInfo();

        // Set up listener for customer info updates
        cleanupListener = addCustomerInfoUpdateListener((info) => {
          console.log('📱 Customer info updated via listener');
          const { isPro, status } = extractSubscriptionState(info);
          set({
            customerInfo: info,
            isProUser: isPro,
            subscriptionStatus: status,
            isLoading: false,
          });
        });

        console.log('✅ Subscription store initialized');
      } catch (error) {
        console.error('❌ Failed to initialize subscription store:', error);
        set({ isLoading: false });
      }
    },

    // Refresh customer info from RevenueCat (invalidates cache first)
    refreshCustomerInfo: async () => {
      if (!featureFlags.revenueCat) return;

      // Prevent multiple simultaneous calls
      if (isRefreshing) {
        console.log('⏭️ Skipping refresh - already in progress');
        return;
      }

      isRefreshing = true;

      try {
        // Invalidate cache to ensure we get fresh data from the server
        await invalidateCustomerInfoCache();
        const customerInfo = await getCustomerInfo();

        const { isPro, status } = extractSubscriptionState(customerInfo);
        set({
          customerInfo,
          isProUser: isPro,
          subscriptionStatus: status,
          isLoading: false,
        });

        console.log('🔄 Customer info refreshed (cache invalidated). Pro access:', isPro);
      } catch (error) {
        console.error('Failed to refresh customer info:', error);
        set({ isLoading: false });
      } finally {
        isRefreshing = false;
      }
    },

    // Update state directly from a CustomerInfo object (e.g. from purchase response)
    // This avoids the cache issue — the info from purchasePackage() is always fresh.
    updateFromCustomerInfo: (info: SubscriptionCustomerInfo) => {
      const { isPro, status } = extractSubscriptionState(info);
      console.log('📦 Store updated directly from CustomerInfo. Pro access:', isPro);
      set({
        customerInfo: info,
        isProUser: isPro,
        subscriptionStatus: status,
        isLoading: false,
      });
    },

    // Restore previous purchases
    restorePurchases: async () => {
      if (!featureFlags.revenueCat) return;
      set({ isLoading: true });

      try {
        await restorePurchases();
        await get().refreshCustomerInfo();
        console.log('✅ Purchases restored');
      } catch (error) {
        console.error('❌ Failed to restore purchases:', error);
        set({ isLoading: false });
        throw error;
      }
    },

    // Check if user has Pro access
    checkProAccess: async () => {
      if (!featureFlags.revenueCat) return false;
      try {
        const isPro = await hasProAccess();
        set({ isProUser: isPro });
        return isPro;
      } catch (error) {
        console.error('Failed to check Pro access:', error);
        return false;
      }
    },
  };
});

// Selector hooks for specific pieces of state
export const useIsProUser = () => useSubscriptionStore((state) => state.isProUser);
export const useSubscriptionLoading = () => useSubscriptionStore((state) => state.isLoading);
export const useCustomerInfo = () => useSubscriptionStore((state) => state.customerInfo);
export const useSubscriptionStatus = () => useSubscriptionStore((state) => state.subscriptionStatus);

// Hook to check if a specific feature is available to Pro users
export const useProFeature = () => {
  const isProUser = useIsProUser();

  return {
    isProUser,
    requiresPro: !isProUser,
    canAccess: (featureName?: string) => {
      if (isProUser) return true;

      console.log(`🔒 Feature "${featureName || 'unknown'}" requires Pro access`);
      return false;
    },
  };
};
