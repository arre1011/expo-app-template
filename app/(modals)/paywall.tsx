/**
 * Paywall Screen
 * Presents subscription options using custom UI with RevenueCat packages
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '../../src/ui/hooks/useSubscriptionStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getPackagePrice,
} from '../../src/services/revenueCatService';
import { colors, spacing } from '../../src/ui/theme';
import { posthog, AnalyticsEvents } from '../../src/services/analyticsService';

export default function PaywallScreen() {
  // Track paywall view on mount
  useState(() => { posthog.capture(AnalyticsEvents.PAYWALL_VIEWED, { trigger: 'settings' }); });

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const updateFromCustomerInfo = useSubscriptionStore(
    (state) => state.updateFromCustomerInfo
  );

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const offering = await getOfferings();
      if (offering?.availablePackages) {
        setPackages(offering.availablePackages);
        // Pre-select yearly package if available
        const yearlyPkg = offering.availablePackages.find(
          (p) => p.identifier.toLowerCase().includes('annual') ||
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
      Alert.alert(
        'Error',
        'Could not load subscription options. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    setSelectedPackage(pkg.identifier);
    posthog.capture(AnalyticsEvents.PURCHASE_STARTED, { plan: getPackageTitle(pkg) });

    try {
      const customerInfo = await purchasePackage(pkg);
      updateFromCustomerInfo(customerInfo);
      posthog.capture(AnalyticsEvents.PURCHASE_COMPLETED, { plan: getPackageTitle(pkg) });

      Alert.alert(
        'Welcome to Pro! 🎉',
        'Thank you for subscribing. All Pro features are now unlocked!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      if (error.message === 'PURCHASE_CANCELLED') {
        posthog.capture(AnalyticsEvents.PURCHASE_CANCELLED, { plan: getPackageTitle(pkg) });
        return;
      }

      if (error.message === 'PURCHASE_TIMEOUT_NO_ENTITLEMENT') {
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

      Alert.alert(
        'Purchases Restored',
        'Your previous purchases have been restored successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert(
        'Restore Failed',
        'Could not restore purchases. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const getPackageTitle = (pkg: PurchasesPackage): string => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('monthly')) return 'Monthly';
    if (id.includes('annual') || id.includes('yearly')) return 'Annual';
    if (id.includes('lifetime')) return 'Lifetime';
    return pkg.product.title;
  };

  const getPackageSubtitle = (pkg: PurchasesPackage): string => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('monthly')) return 'Billed monthly';
    if (id.includes('annual') || id.includes('yearly')) return 'Best value • Save 30%';
    if (id.includes('lifetime')) return 'One-time payment';
    return 'Subscription';
  };

  const isPackageSelected = (pkg: PurchasesPackage): boolean => {
    return selectedPackage === pkg.identifier;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>
            Unlock advanced features to track your drinks better
          </Text>
        </View>

        {/* Features List - MVP: Only show features available in MVP */}
        <View style={styles.features}>
          <FeatureItem
            icon="📊"
            title="Real-time Alcohol Level Tracking"
            description="Monitor your estimated alcohol level in real-time"
          />
          <FeatureItem
            icon="🎯"
            title="Custom Goals"
            description="Set personalized alcohol level limits and goals"
          />
          <FeatureItem
            icon="🔔"
            title="Goal Notifications"
            description="Get notified when approaching your limit"
          />
          <FeatureItem
            icon="❤️"
            title="Support Development"
            description="Help us build more features"
          />
          {/* MVP: Features disabled - see MVP_CHANGES.md
          <FeatureItem
            icon="📊"
            title="Advanced Statistics"
            description="Detailed insights and trends over time"
          />
          <FeatureItem
            icon="📅"
            title="Extended History"
            description="Access unlimited drink history"
          />
          <FeatureItem
            icon="📈"
            title="Export Data"
            description="Export your data for personal records"
          />
          <FeatureItem
            icon="☁️"
            title="Cloud Sync"
            description="Sync across all your devices (coming soon)"
          />
          */}
        </View>

        {/* Subscription Packages */}
        <View style={styles.packagesContainer}>
          <Text style={styles.packagesTitle}>Choose your plan</Text>

          {packages.length === 0 ? (
            <View style={styles.noPackagesContainer}>
              <Text style={styles.noPackagesText}>
                No subscription options available at the moment.
              </Text>
              <Text style={styles.noPackagesSubtext}>
                Please check back later or contact support.
              </Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  isPackageSelected(pkg) && styles.packageCardSelected,
                ]}
                onPress={() => setSelectedPackage(pkg.identifier)}
                disabled={isPurchasing}
              >
                <View style={styles.packageHeader}>
                  <View style={styles.packageTitleContainer}>
                    <Text style={styles.packageTitle}>
                      {getPackageTitle(pkg)}
                    </Text>
                    <Text style={styles.packageSubtitle}>
                      {getPackageSubtitle(pkg)}
                    </Text>
                  </View>
                  <View style={styles.packagePriceContainer}>
                    <Text style={styles.packagePrice}>
                      {getPackagePrice(pkg)}
                    </Text>
                  </View>
                </View>

                {isPackageSelected(pkg) && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Purchase Button */}
        {packages.length > 0 && (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (isPurchasing || isRestoring) && styles.purchaseButtonDisabled,
            ]}
            onPress={() => {
              const pkg = packages.find((p) => p.identifier === selectedPackage);
              if (pkg) handlePurchase(pkg);
            }}
            disabled={isPurchasing || isRestoring || !selectedPackage}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Restore Purchases Button */}
        <TouchableOpacity
          onPress={handleRestorePurchases}
          disabled={isRestoring || isPurchasing}
          style={styles.restoreButton}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          Subscriptions will auto-renew unless cancelled. See Terms of Service
          and Privacy Policy for details.
        </Text>
      </ScrollView>
    </View>
  );
}

// Feature List Item Component
interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  packagesContainer: {
    marginBottom: spacing.xl,
  },
  packagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  packageCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packageTitleContainer: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  packageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  packagePriceContainer: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noPackagesContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noPackagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noPackagesSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  restoreButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  restoreText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
