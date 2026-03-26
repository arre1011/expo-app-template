/**
 * RevenueCat Service
 * Manages subscriptions, entitlements, and customer info for the app
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================================
// ⚠️  WICHTIG: VOR JEDEM BUILD ÜBERPRÜFEN!
// ============================================================================
// Für lokale Tests: LOCAL_DEV_KEY verwenden (auskommentiert = env key wird verwendet)
// Für Production Build: LOCAL_DEV_KEY MUSS auskommentiert oder entfernt sein!
// ============================================================================

// 🔴 REMOVE_BEFORE_BUILD: Diese Zeile vor jedem EAS Build auskommentieren!
// const LOCAL_DEV_KEY = 'test_RIYJBdoDAPQadpVSUJeJekGGsDx'; // ← Test Key für lokale Entwicklung
const LOCAL_DEV_KEY = undefined; // ← Für Production Build - nutzt EAS Secret

// Configuration
// Automatically selects the right API key based on environment and platform
const getApiKey = (): string => {
  // 1. Check for local dev key (for testing real purchases locally)
  if (LOCAL_DEV_KEY) {
    console.log('🧪 RevenueCat: Using LOCAL_DEV_KEY (remove before production build!)');
    return LOCAL_DEV_KEY;
  }

  // 2. Check if running in Expo Go (no bundleIdentifier means Expo Go)
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  const isExpoGo = !bundleId || bundleId === 'host.exp.Exponent';

  if (isExpoGo) {
    // Expo Go: Use test key (no real purchases possible)
    console.log('🧪 RevenueCat: Using Test Key (Expo Go mode)');
    return 'test_RIYJBdoDAPQadpVSUJeJekGGsDx';
  }

  // 3. Get platform-specific API key from EXPO_PUBLIC_ environment variables
  // iOS keys start with 'appl_', Android keys start with 'goog_'
  // These are inlined into the bundle at build time by Expo
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  // Select key based on platform
  const envApiKey = Platform.OS === 'ios' ? iosKey : androidKey;
  const platformName = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const expectedPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';

  // Validate the key
  const isValidKey = envApiKey && (envApiKey.startsWith(expectedPrefix) || envApiKey.startsWith('test_'));

  if (isValidKey) {
    console.log(`🔑 RevenueCat: Using ${platformName} Production Key`);
    return envApiKey;
  }

  // Fallback for EAS builds without env key set
  console.warn(`⚠️  RevenueCat: No valid ${platformName} key found (expected ${expectedPrefix}*), using test key fallback`);
  return 'test_RIYJBdoDAPQadpVSUJeJekGGsDx';
};

const API_KEY = getApiKey();
export const ENTITLEMENT_ID = 'pro';

// Product IDs
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime_pro',
} as const;

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts, before any other RevenueCat methods
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);

    Purchases.configure({
      apiKey: API_KEY,
      appUserID: userId, // Optional: pass user ID for cross-platform sync
    });

    console.log('✅ RevenueCat initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
    throw error;
  }
}

/**
 * Get current customer info (subscription status, entitlements, etc.)
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
}

/**
 * Check if user has Pro entitlement
 */
export async function hasProAccess(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return entitlement !== undefined;
  } catch (error) {
    console.error('Failed to check Pro access:', error);
    // Default to false if there's an error checking entitlements
    return false;
  }
}

/**
 * Get available offerings (subscription packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }

    console.warn('No current offering found');
    return null;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
}

/**
 * Get a specific named offering by identifier.
 * Falls back to the current (default) offering if not found.
 * Used for deep link variants (e.g., 'influencer_offer').
 */
export async function getOfferingById(identifier: string): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const named = offerings.all[identifier];
    if (named) return named;

    console.warn(`Offering '${identifier}' not found, falling back to current`);
    return offerings.current ?? null;
  } catch (error) {
    console.error(`Failed to get offering '${identifier}':`, error);
    throw error;
  }
}

/**
 * Get specific package by identifier
 */
export async function getPackageByIdentifier(
  identifier: string
): Promise<PurchasesPackage | null> {
  try {
    const offering = await getOfferings();
    if (!offering) return null;

    const pkg = offering.availablePackages.find(
      (p) => p.identifier === identifier
    );
    return pkg || null;
  } catch (error) {
    console.error(`Failed to get package ${identifier}:`, error);
    return null;
  }
}

/**
 * Purchase a package
 * @param pkg The package to purchase
 * @returns CustomerInfo after purchase
 *
 * Includes a timeout fallback: if Purchases.purchasePackage() hangs
 * (a known RevenueCat bug in sandbox/TestFlight), we fall back to
 * fetching fresh customer info to check if the purchase went through.
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo> {
  try {
    console.log('🛒 Starting purchase for:', pkg.identifier);

    // Wrap in a timeout — purchasePackage() can hang in sandbox/TestFlight
    const PURCHASE_TIMEOUT_MS = 10000; // 10 seconds
    const customerInfo = await Promise.race([
      Purchases.purchasePackage(pkg).then(result => {
        console.log('✅ Purchase resolved normally');
        return result.customerInfo;
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PURCHASE_TIMEOUT')), PURCHASE_TIMEOUT_MS)
      ),
    ]);

    console.log('✅ Purchase successful. Entitlements:', Object.keys(customerInfo.entitlements.active));
    return customerInfo;
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log('Purchase cancelled by user');
      throw new Error('PURCHASE_CANCELLED');
    }

    // Handle timeout: the purchase may have succeeded natively but the SDK hung.
    // Invalidate cache and fetch fresh customer info as a fallback.
    if (error.message === 'PURCHASE_TIMEOUT') {
      console.warn('⏱️ Purchase timed out — checking if purchase went through anyway...');
      try {
        await Purchases.invalidateCustomerInfoCache();
        const fallbackInfo = await Purchases.getCustomerInfo();
        const hasEntitlement = fallbackInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        console.log('⏱️ Fallback check — Pro access:', hasEntitlement, 'Entitlements:', Object.keys(fallbackInfo.entitlements.active));

        if (hasEntitlement) {
          console.log('✅ Purchase confirmed via fallback check');
          return fallbackInfo;
        }
      } catch (fallbackError) {
        console.error('⏱️ Fallback check also failed:', fallbackError);
      }
      // If fallback also didn't find the entitlement, throw a descriptive error
      throw new Error('PURCHASE_TIMEOUT_NO_ENTITLEMENT');
    }

    console.error('Purchase failed:', error);
    throw error;
  }
}

/**
 * Restore purchases (for users who already purchased on another device)
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('✅ Purchases restored successfully');
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
}

/**
 * Get subscription status details
 */
export async function getSubscriptionStatus(): Promise<{
  isActive: boolean;
  productIdentifier?: string;
  expirationDate?: string;
  willRenew?: boolean;
  isLifetime?: boolean;
}> {
  try {
    const customerInfo = await getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!entitlement) {
      return { isActive: false };
    }

    return {
      isActive: true,
      productIdentifier: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate || undefined,
      willRenew: entitlement.willRenew,
      isLifetime: entitlement.expirationDate === null,
    };
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return { isActive: false };
  }
}

/**
 * Set user ID for cross-platform identification
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('✅ User identified:', userId);
  } catch (error) {
    console.error('Failed to identify user:', error);
    throw error;
  }
}

/**
 * Log out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut();
    console.log('✅ User logged out');
  } catch (error) {
    console.error('Failed to logout user:', error);
    throw error;
  }
}

/**
 * Get formatted price for a package
 */
export function getPackagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get package duration description
 */
export function getPackageDuration(pkg: PurchasesPackage): string {
  const id = pkg.identifier.toLowerCase();

  if (id.includes('monthly')) return 'per month';
  if (id.includes('annual') || id.includes('yearly')) return 'per year';
  if (id.includes('lifetime')) return 'one-time';

  // Fallback to product description
  return pkg.product.subscriptionPeriod || 'subscription';
}

/**
 * Listen to customer info updates
 * Use this to react to purchase changes in real-time
 */
export function addCustomerInfoUpdateListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);

  // Return cleanup function
  return () => {
    // Note: react-native-purchases doesn't provide removeListener
    // The listener will be automatically cleaned up when the app closes
  };
}

/**
 * Check if user is eligible for intro pricing
 */
export async function isEligibleForIntro(
  productIds: string[]
): Promise<{ [productId: string]: boolean }> {
  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      productIds
    );

    const result: { [productId: string]: boolean } = {};
    Object.keys(eligibility).forEach((productId) => {
      // Check status using the enum
      const status = eligibility[productId].status;
      result[productId] = status === 0; // INTRO_ELIGIBILITY_STATUS.ELIGIBLE = 0
    });

    return result;
  } catch (error) {
    console.error('Failed to check intro eligibility:', error);
    return {};
  }
}

/**
 * Set subscriber attributes for influencer/campaign attribution.
 * These appear in the RevenueCat dashboard and can be used for
 * filtering subscribers by influencer, campaign, etc.
 */
export async function setSubscriberAttributes(attrs: {
  influencerName?: string | null;
  campaignId?: string | null;
  mediaSource?: string;
}): Promise<void> {
  try {
    if (attrs.mediaSource) {
      await Purchases.setMediaSource(attrs.mediaSource);
    }
    if (attrs.campaignId) {
      await Purchases.setCampaign(attrs.campaignId);
    }
    // Custom attributes for influencer tracking
    const custom: Record<string, string> = {};
    if (attrs.influencerName) {
      custom['$influencerName'] = attrs.influencerName;
    }
    if (Object.keys(custom).length > 0) {
      await Purchases.setAttributes(custom);
    }
  } catch (error) {
    console.warn('Failed to set subscriber attributes (non-blocking):', error);
  }
}

export default {
  initializeRevenueCat,
  getCustomerInfo,
  hasProAccess,
  getOfferings,
  getPackageByIdentifier,
  purchasePackage,
  restorePurchases,
  getSubscriptionStatus,
  identifyUser,
  logoutUser,
  getPackagePrice,
  getPackageDuration,
  addCustomerInfoUpdateListener,
  isEligibleForIntro,
  setSubscriberAttributes,
  ENTITLEMENT_ID,
  PRODUCT_IDS,
};
