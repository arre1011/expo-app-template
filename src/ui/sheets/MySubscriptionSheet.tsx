/**
 * My Subscription Bottom Sheet
 *
 * Shows subscription status with clear options to:
 * - Change plan (→ OS subscription management)
 * - Cancel subscription (→ OS subscription management)
 * - Restore purchases
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ModalHeader } from '../components';
import { useSubscriptionStatus, useSubscriptionStore } from '../hooks/useSubscriptionStore';
import { restorePurchases } from '../../services/revenueCatService';

// ─── Props ────────────────────────────────────────────────────

interface MySubscriptionSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────

function getSubscriptionManagementURL(): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }
  return 'https://play.google.com/store/account/subscriptions';
}

function formatPlanName(productIdentifier?: string): string {
  if (!productIdentifier) return 'Subscription';
  const id = productIdentifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly') || id.includes('year')) {
    return 'Annual Plan';
  }
  if (id.includes('month')) {
    return 'Monthly Plan';
  }
  return 'Subscription';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────

export function MySubscriptionSheet({ open, onClose }: MySubscriptionSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const subscriptionStatus = useSubscriptionStatus();
  const refreshCustomerInfo = useSubscriptionStore(state => state.refreshCustomerInfo);
  const [isRestoring, setIsRestoring] = useState(false);

  const snapPoints = useMemo(() => ['70%'], []);

  const planName = formatPlanName(subscriptionStatus?.productIdentifier);
  const isLifetime = subscriptionStatus?.isLifetime;

  // Open/close based on `open` prop
  useEffect(() => {
    if (open) {
      setIsRestoring(false);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleOpenSubscriptionManagement = () => {
    Linking.openURL(getSubscriptionManagementURL());
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      await refreshCustomerInfo();
      Alert.alert(
        'Purchases Restored',
        'Your purchases have been restored successfully.',
        [{ text: 'OK' }]
      );
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

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@drinkmonitoring.app?subject=Subscription Support');
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <ModalHeader title="My Subscription" onClose={handleClose} />

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {/* Subscription Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Active</Text>
          </View>

          <Text style={styles.planName}>{planName}</Text>

          {isLifetime ? (
            <Text style={styles.planDetail}>Lifetime Access</Text>
          ) : subscriptionStatus?.expirationDate ? (
            <Text style={styles.planDetail}>
              {subscriptionStatus.willRenew ? 'Renews' : 'Expires'}:{' '}
              {formatDate(subscriptionStatus.expirationDate)}
            </Text>
          ) : null}
        </View>

        {/* Actions */}
        {!isLifetime && (
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleOpenSubscriptionManagement}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="swap-horizontal-outline" size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.actionLabel}>Change Plan</Text>
              <Ionicons name="open-outline" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleRestorePurchases}
              disabled={isRestoring}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
              </View>
              {isRestoring ? (
                <View style={styles.actionLabelContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <Text style={styles.actionLabel}>Restore Purchases</Text>
              )}
              {!isRestoring && (
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleContactSupport}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.actionLabel}>Contact Support</Text>
              <Ionicons name="open-outline" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Subscription — clearly visible, not hidden */}
        {!isLifetime && (
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={handleOpenSubscriptionManagement}
          >
            <Text style={styles.cancelLinkText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}

        {/* Info text */}
        <Text style={styles.infoText}>
          Your subscription is managed through the{' '}
          {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}.
          Changes and cancellations take effect at the end of the current billing period.
        </Text>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.textLight,
    width: 40,
  },
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  planName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  planDetail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  actionIcon: {
    width: 32,
    marginRight: spacing.sm,
  },
  actionLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  actionLabelContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.backgroundSecondary,
    marginLeft: 48,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  cancelLinkText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});
