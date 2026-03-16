/**
 * PaywallContent — Reusable paywall component used across:
 * - Onboarding (last step)
 * - Subscription Wall (trial expired, hard paywall)
 * - Settings modal upgrade
 *
 * Supports 3 variants via variantConfig:
 * - 'standard': Default 7-day trial paywall
 * - 'influencer_trial': Extended trial with influencer branding
 * - 'gift': Free offer with struck-through price
 *
 * Contains all package loading, purchase, and restore logic.
 * Context-dependent text is passed via props.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesPackage } from 'react-native-purchases';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import {
  getOfferings,
  getOfferingById,
  purchasePackage,
  restorePurchases,
  getPackagePrice,
} from '../../services/revenueCatService';
import { useSubscriptionStore } from '../hooks/useSubscriptionStore';
import { featureFlags } from '../../config/featureFlags';
import {
  requestNotificationPermissions,
  scheduleTrialReminder,
} from '../../services/notificationService';
import { posthog, AnalyticsEvents } from '../../services/analyticsService';
import { useOfferStore } from '../hooks/useOfferStore';
// CountdownTimer removed — no real expiration logic behind it

// ─── Variant Config ─────────────────────────────────────────

export type PaywallVariant = 'standard' | 'influencer_trial' | 'gift';

export interface PaywallVariantConfig {
  variant: PaywallVariant;
  /** Number of trial days (default: 7 for standard) */
  trialDays?: number;
  /** Influencer name shown in header (influencer variant) */
  influencerName?: string | null;
  /** @deprecated Countdown removed — kept for backwards compatibility */
  showCountdown?: boolean;
  /** RevenueCat offering identifier. Null = current/default */
  offeringIdentifier?: string | null;
}

// ─── Props ───────────────────────────────────────────────────

export interface PaywallContentProps {
  /** Main title displayed at top */
  title: string;
  /** Subtitle below title */
  subtitle?: string;
  /** Show back/close button (false for hard paywall) */
  showBackButton?: boolean;
  /** Called after successful purchase or restore */
  onPurchaseSuccess: () => void;
  /** Called when back button is pressed */
  onBack?: () => void;
  /** Variant configuration for deep link offers */
  variantConfig?: PaywallVariantConfig;
}

// ─── Component ───────────────────────────────────────────────

export function PaywallContent({
  title,
  subtitle,
  showBackButton = false,
  onPurchaseSuccess,
  onBack,
  variantConfig,
}: PaywallContentProps) {
  const variant = variantConfig?.variant ?? 'standard';
  const trialDays = variantConfig?.trialDays ?? 7;

  // Default subtitle based on variant
  const displaySubtitle = subtitle ?? (
    variant === 'gift' ? 'FREE FOR YOU' :
    variant === 'influencer_trial' ? `${trialDays}-day free trial` :
    '7-day free trial'
  );

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const updateFromCustomerInfo = useSubscriptionStore(state => state.updateFromCustomerInfo);

  // Calculate trial end date — used in legal text
  const trialEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + trialDays);
    return date;
  }, [trialDays]);

  const trialEndDateString = trialEndDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // ─── Package Loading ─────────────────────────────────────

  const loadPackages = useCallback(async () => {
    setIsLoadingPackages(true);
    try {
      const offeringId = variantConfig?.offeringIdentifier;
      const offering = offeringId
        ? await getOfferingById(offeringId)
        : await getOfferings();

      if (offering?.availablePackages) {
        setPackages(offering.availablePackages);
        // Pre-select yearly package
        const yearlyPkg = offering.availablePackages.find(
          (p) =>
            p.identifier.toLowerCase().includes('annual') ||
            p.identifier.toLowerCase().includes('yearly')
        );
        if (yearlyPkg) {
          setSelectedPackage(yearlyPkg.identifier);
        } else if (offering.availablePackages.length > 0) {
          setSelectedPackage(offering.availablePackages[0].identifier);
        }
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [variantConfig?.offeringIdentifier]);

  useEffect(() => {
    loadPackages();
    // Track paywall view with attribution
    const offerState = useOfferStore.getState();
    posthog.capture(AnalyticsEvents.PAYWALL_VARIANT_VIEWED, {
      variant: offerState.offerType,
      influencer_name: offerState.influencerName,
    });
  }, [loadPackages]);

  // ─── Purchase Handlers ───────────────────────────────────

  // Schedule trial reminder notification after successful purchase/restore
  const scheduleReminderIfEligible = async () => {
    if (!featureFlags.trialReminder) return;

    const status = useSubscriptionStore.getState().subscriptionStatus;
    // Only schedule for trial/subscription (not lifetime — no expiration)
    if (status?.expirationDate && !status.isLifetime) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleTrialReminder(status.expirationDate);
      }
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    setSelectedPackage(pkg.identifier);

    // Read offer state for attribution tracking
    const offerState = useOfferStore.getState();

    try {
      posthog.capture(AnalyticsEvents.PURCHASE_STARTED, {
        package: pkg.identifier,
        variant: offerState.offerType,
        influencer_name: offerState.influencerName,
      });

      // Use the customerInfo returned directly from the purchase — it's always fresh.
      // Do NOT rely on refreshCustomerInfo() here, as it may return cached (stale) data.
      const customerInfo = await purchasePackage(pkg);
      updateFromCustomerInfo(customerInfo);

      posthog.capture(AnalyticsEvents.PURCHASE_COMPLETED, {
        package: pkg.identifier,
        variant: offerState.offerType,
        influencer_name: offerState.influencerName,
      });

      await scheduleReminderIfEligible();
      onPurchaseSuccess();
    } catch (error: any) {
      if (error.message === 'PURCHASE_CANCELLED') {
        posthog.capture(AnalyticsEvents.PURCHASE_CANCELLED, {
          package: pkg.identifier,
          variant: offerState.offerType,
          influencer_name: offerState.influencerName,
        });
        setIsPurchasing(false);
        return;
      }
      if (error.message === 'PURCHASE_TIMEOUT_NO_ENTITLEMENT') {
        console.warn('Purchase timed out and entitlement not found');
        Alert.alert(
          'Purchase Processing',
          'Your purchase may still be processing. Please tap "Restore Purchases" in a moment.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('Purchase failed:', error);
        Alert.alert(
          'Purchase Failed',
          'Could not complete your purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      updateFromCustomerInfo(customerInfo);
      await scheduleReminderIfEligible();
      onPurchaseSuccess();
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert(
        'Restore Failed',
        'Could not restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };


  // ─── Package Helpers ─────────────────────────────────────

  const getPackageTitle = (pkg: PurchasesPackage): string => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('monthly')) return 'Monthly';
    if (id.includes('annual') || id.includes('yearly')) return 'Annual';
    if (id.includes('lifetime')) return 'Lifetime';
    return pkg.product.title;
  };

  const getPackageSubtitle = (pkg: PurchasesPackage): string => {
    const id = pkg.identifier.toLowerCase();
    const price = getPackagePrice(pkg);

    if (variant === 'gift') {
      // Gift variant: show that it's free
      if (id.includes('monthly')) return `Normally ${price}/month`;
      if (id.includes('annual') || id.includes('yearly')) return `Normally ${price}/year`;
      if (id.includes('lifetime')) return 'One-time payment — Forever';
      return 'Subscription';
    }

    if (id.includes('monthly')) return `${trialDays}-day free trial, then ${price}/month`;
    if (id.includes('annual') || id.includes('yearly')) return `${trialDays}-day free trial — Save 26%`;
    if (id.includes('lifetime')) return 'One-time payment — Forever';
    return 'Subscription';
  };

  const getPackageBadge = (pkg: PurchasesPackage): string | null => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('annual') || id.includes('yearly')) return 'POPULAR';
    if (id.includes('lifetime')) return 'BEST VALUE';
    return null;
  };

  // ─── CTA Button Text ──────────────────────────────────────

  const ctaButtonText = variant === 'gift'
    ? 'Claim Your Gift'
    : variant === 'influencer_trial'
    ? 'Claim Offer'
    : 'Start Free Trial';

  // ─── Legal Text ────────────────────────────────────────────

  const legalText = variant === 'gift'
    ? 'This gift grants you full access to GlassCount Premium. No payment required. You can manage your subscription anytime in your device settings.'
    : `Your free trial starts today. You won't be charged until ${trialEndDateString}. Subscriptions auto-renew unless cancelled 24 hours before the trial ends. You can cancel anytime in your device settings or directly from this app.`;

  // ─── Get yearly price for gift header ──────────────────────

  const yearlyPackage = packages.find(
    (p) =>
      p.identifier.toLowerCase().includes('annual') ||
      p.identifier.toLowerCase().includes('yearly')
  );

  // ─── Loading State ───────────────────────────────────────

  if (isLoadingPackages) {
    return (
      <View style={styles.container}>
        {showBackButton && onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </View>
    );
  }

  // ─── Main Render ─────────────────────────────────────────

  return (
    <View style={styles.container}>
      {showBackButton && onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Influencer Header */}
        {variant === 'influencer_trial' && (
          <View style={styles.influencerHeader}>
            <View style={styles.exclusiveBadge}>
              <Ionicons name="gift-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.exclusiveBadgeText}>EXCLUSIVE OFFER</Text>
            </View>
            {variantConfig?.influencerName && (
              <Text style={styles.influencerName}>
                from @{variantConfig.influencerName}
              </Text>
            )}
            <Text style={styles.influencerTrialText}>
              {trialDays} DAYS FREE
            </Text>
          </View>
        )}

        {/* Gift Header */}
        {variant === 'gift' && (
          <View style={styles.giftHeader}>
            <View style={styles.giftBadge}>
              <Ionicons name="gift-outline" size={20} color={colors.success} />
              <Text style={styles.giftBadgeText}>You have a gift!</Text>
            </View>
            <Text style={styles.giftAppName}>GlassCount Premium</Text>
            {yearlyPackage && (
              <Text style={styles.giftOriginalPrice}>
                {getPackagePrice(yearlyPackage)}/year
              </Text>
            )}
            <Text style={styles.giftFreeText}>FREE FOR YOU</Text>
            {yearlyPackage && (
              <Text style={styles.giftSavings}>You save: 100%</Text>
            )}
          </View>
        )}

        {/* Standard Header */}
        {variant === 'standard' && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{displaySubtitle}</Text>
          </View>
        )}

        {/* Influencer / standard title (non-gift) */}
        {variant === 'influencer_trial' && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}

        {/* Benefits */}
        {featureFlags.paywallBenefits && (
          <View style={styles.features}>
            <FeatureItem icon="pulse-outline" text="Benefit from real-time monitoring" iconColor={colors.warning} />
            <FeatureItem icon="eye-outline" text="Build awareness of your drinking habits" iconColor={colors.info} />
            <FeatureItem icon="flag-outline" text="Reach your personal goals" iconColor={colors.success} />
          </View>
        )}

        {/* Trust Signals */}
        {featureFlags.paywallTrustSignals && variant !== 'gift' && (
          <View style={styles.trustSignals}>
            <View style={styles.trustSignalRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
              <Text style={styles.trustSignalText}><Text style={styles.trustSignalBold}>Cancel anytime</Text> — right from the app</Text>
            </View>
            <View style={styles.trustSignalRow}>
              <Ionicons name="notifications-outline" size={18} color={colors.success} />
              <Text style={styles.trustSignalText}>We'll remind you <Text style={styles.trustSignalBold}>2 days before</Text> and <Text style={styles.trustSignalBold}>on the last day</Text> of your trial</Text>
            </View>
          </View>
        )}

        {/* Gift Trust Signal */}
        {variant === 'gift' && (
          <View style={styles.giftTrustSignal}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
            <Text style={styles.trustSignalText}>
              <Text style={styles.trustSignalBold}>No subscription. No costs.</Text> — This is a gift.
            </Text>
          </View>
        )}

        {/* Packages — hidden for gift variant (no package selection needed) */}
        {variant !== 'gift' && (
          <View style={styles.packagesContainer}>
            {packages.length === 0 ? (
              <View style={styles.noPackagesContainer}>
                <Text style={styles.noPackagesText}>
                  No subscription options available.
                </Text>
              </View>
            ) : (
              packages.map((pkg) => {
                const badge = getPackageBadge(pkg);
                const isSelected = selectedPackage === pkg.identifier;

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => setSelectedPackage(pkg.identifier)}
                    disabled={isPurchasing}
                  >
                    {badge && (
                      <View style={styles.packageBadge}>
                        <Text style={styles.packageBadgeText}>{badge}</Text>
                      </View>
                    )}

                    <View style={styles.packageHeader}>
                      <View style={styles.packageTitleContainer}>
                        <Text style={styles.packageTitle}>{getPackageTitle(pkg)}</Text>
                        <Text style={styles.packageSubtitle}>{getPackageSubtitle(pkg)}</Text>
                      </View>
                      <Text style={styles.packagePrice}>{getPackagePrice(pkg)}</Text>
                    </View>

                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Purchase Button */}
        {(variant === 'gift' || packages.length > 0) && (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              variant === 'gift' && styles.purchaseButtonGift,
              (isPurchasing || isRestoring) && styles.purchaseButtonDisabled,
            ]}
            onPress={() => {
              if (variant === 'gift') {
                // For gift: purchase the yearly package automatically
                if (yearlyPackage) handlePurchase(yearlyPackage);
              } else {
                const pkg = packages.find((p) => p.identifier === selectedPackage);
                if (pkg) handlePurchase(pkg);
              }
            }}
            disabled={isPurchasing || isRestoring || (!selectedPackage && variant !== 'gift')}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>{ctaButtonText}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Restore Purchases · Terms · Privacy Policy */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            onPress={handleRestorePurchases}
            disabled={isRestoring || isPurchasing}
            style={styles.secondaryActionButton}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.secondaryLink}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.secondaryDot}>·</Text>
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => Linking.openURL('https://drink-tracking-landingpage.vercel.app/terms.html')}
          >
            <Text style={styles.secondaryLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.secondaryDot}>·</Text>
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => Linking.openURL('https://drink-tracking-landingpage.vercel.app/privacy.html')}
          >
            <Text style={styles.secondaryLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer — pushes disclaimer to bottom on large screens, scrollable on small */}
        <View style={styles.bottomSpacer} />

        {/* Legal Text */}
        <Text style={styles.legalText}>
          {legalText}
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── FeatureItem Subcomponent ────────────────────────────────

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  iconColor?: string;
}

function FeatureItem({ icon, text, iconColor = colors.primary }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
      <Ionicons name="checkmark" size={20} color={colors.success} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },

  // Standard Header
  header: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Influencer Header
  influencerHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  exclusiveBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    letterSpacing: 1,
  },
  influencerName: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  influencerTrialText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },

  // Gift Header
  giftHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  giftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  giftBadgeText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  giftAppName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  giftOriginalPrice: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginBottom: spacing.xs,
  },
  giftFreeText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  giftSavings: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  giftTrustSignal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}08`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  // Features
  features: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },

  // Trust Signals
  trustSignals: {
    backgroundColor: `${colors.success}08`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  trustSignalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trustSignalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  trustSignalBold: {
    fontWeight: fontWeight.bold,
  },

  // Packages
  packagesContainer: {
    marginBottom: spacing.md,
  },
  noPackagesContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noPackagesText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  packageBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  packageBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packageTitleContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  packageTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  packageSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },

  // Purchase Button
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xs,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  purchaseButtonGift: {
    backgroundColor: colors.text,
    shadowColor: colors.text,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },

  bottomSpacer: {
    flex: 1,
    minHeight: spacing.xs,
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryActionButton: {
    padding: spacing.xs,
  },
  secondaryLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  secondaryDot: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },

  // Legal
  legalText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
});
