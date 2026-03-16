/**
 * Subscription Configuration
 * Defines pricing, free trial, and paywall triggers
 */

export const SUBSCRIPTION_CONFIG = {
  // NOTE: Prices are fetched dynamically from RevenueCat/App Store
  // Do NOT hardcode prices here - configure them in App Store Connect

  // Free tier limits
  FREE_LIMITS: {
    MAX_DRINKS_BEFORE_NUDGE: 3, // Show gentle upgrade prompt
    MAX_DRINKS_BEFORE_HARD_PAYWALL: 10, // Hard limit for free tier
    MAX_DAYS_BEFORE_PAYWALL: 3, // Days before showing paywall
    MAX_HISTORY_DAYS: 7, // Free users see last 7 days only
    MAX_EXPORTS_PER_MONTH: 0, // No exports for free
  },

  // Paywall triggers
  PAYWALL_TRIGGERS: {
    ON_APP_START: false, // Never block on start
    ON_FIRST_DRINK: false, // Never block first drink
    AFTER_DRINKS_COUNT: 10, // Show after 10 drinks
    AFTER_DAYS_USED: 3, // Show after 3 days
    ON_PRO_FEATURE_ACCESS: true, // Show when accessing Pro features
  },

  // Pro features
  PRO_FEATURES: {
    UNLIMITED_DRINKS: true,
    EXTENDED_HISTORY: true, // Unlimited history
    ADVANCED_STATISTICS: true,
    EXPORT_DATA: true,
    CLOUD_SYNC: false, // Coming soon
    CUSTOM_GOALS: true,
    PRIORITY_SUPPORT: true,
  },

  // Coupon codes (for promo campaigns)
  COUPON_CODES: {
    LAUNCH_PROMO: {
      code: 'LAUNCH2025',
      discountPercent: 30,
      validUntil: '2025-03-31',
      maxUses: 1000,
    },
    FRIEND_REFERRAL: {
      code: 'FRIEND20',
      discountPercent: 20,
      validUntil: null, // No expiry
      maxUses: null, // Unlimited
    },
  },
} as const;

/**
 * Check if user should see paywall nudge (soft)
 */
export function shouldShowPaywallNudge(
  drinksCount: number,
  daysUsed: number,
  isProUser: boolean
): boolean {
  if (isProUser) return false;

  return (
    drinksCount >= SUBSCRIPTION_CONFIG.FREE_LIMITS.MAX_DRINKS_BEFORE_NUDGE &&
    drinksCount < SUBSCRIPTION_CONFIG.FREE_LIMITS.MAX_DRINKS_BEFORE_HARD_PAYWALL
  );
}

/**
 * Check if user should see hard paywall (blocking)
 */
export function shouldShowHardPaywall(
  drinksCount: number,
  daysUsed: number,
  isProUser: boolean
): boolean {
  if (isProUser) return false;

  return (
    drinksCount >= SUBSCRIPTION_CONFIG.FREE_LIMITS.MAX_DRINKS_BEFORE_HARD_PAYWALL ||
    daysUsed >= SUBSCRIPTION_CONFIG.FREE_LIMITS.MAX_DAYS_BEFORE_PAYWALL
  );
}

/**
 * Get paywall message based on trigger
 */
export function getPaywallMessage(
  drinksCount: number,
  daysUsed: number
): { title: string; message: string; isHard: boolean } {
  const isHard = shouldShowHardPaywall(drinksCount, daysUsed, false);

  if (isHard) {
    return {
      title: '🎯 Upgrade to Continue',
      message:
        "You've reached the free tier limit. Upgrade to Pro to continue tracking your drinks and unlock powerful features!",
      isHard: true,
    };
  }

  return {
    title: '✨ Loving the App?',
    message:
      "You're getting great value! Upgrade to Pro for advanced statistics, unlimited history, and data export.",
    isHard: false,
  };
}

/**
 * Validate coupon code
 */
export function validateCouponCode(code: string): {
  valid: boolean;
  discount?: number;
  message?: string;
} {
  const upperCode = code.toUpperCase().trim();

  for (const [key, coupon] of Object.entries(SUBSCRIPTION_CONFIG.COUPON_CODES)) {
    if (coupon.code === upperCode) {
      // Check expiry
      if (coupon.validUntil) {
        const expiryDate = new Date(coupon.validUntil);
        if (new Date() > expiryDate) {
          return {
            valid: false,
            message: 'This coupon code has expired',
          };
        }
      }

      return {
        valid: true,
        discount: coupon.discountPercent,
        message: `${coupon.discountPercent}% discount applied!`,
      };
    }
  }

  return {
    valid: false,
    message: 'Invalid coupon code',
  };
}

/**
 * Calculate discounted price
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): number {
  return Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));
}
