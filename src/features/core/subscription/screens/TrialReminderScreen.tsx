import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/ui/components';
import { appConfig } from '@/config/appConfig';
import { useSubscriptionStatus } from '@/features/core/subscription/state/useSubscriptionStore';
import { requestStoreReview } from '@/infrastructure/store-review/store-review';
import { markReminderDismissed } from '@/infrastructure/notifications';
import { analytics } from '@/infrastructure/analytics';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';

function getSubscriptionManagementURL(): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }
  return 'https://play.google.com/store/account/subscriptions';
}

export default function TrialReminderScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const subscriptionStatus = useSubscriptionStatus();

  useEffect(() => {
    analytics.track('wrap_up_viewed');
  }, []);

  const getDaysRemaining = (): number | null => {
    if (!subscriptionStatus?.expirationDate) return null;
    const expiry = new Date(subscriptionStatus.expirationDate);
    const now = new Date();
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  const getTitle = (): string => {
    if (daysRemaining !== null) {
      if (daysRemaining > 1) return `Your trial ends in\n${daysRemaining} days`;
      if (daysRemaining === 1) return 'Your trial ends\ntomorrow';
      return 'Your trial ends\ntoday';
    }
    if (type === '48h') return 'Your trial ends in\n2 days';
    if (type === 'expiry') return 'Your trial ends\ntoday';
    return 'Your trial is\nending soon';
  };

  const handleClose = async (action: 'close' | 'continue') => {
    analytics.track('wrap_up_action', { action, reminder_type: type ?? 'unknown' });
    const reminderType = (type === 'expiry' || daysRemaining === 0) ? 'expiry' : '48h';
    await markReminderDismissed(reminderType);

    if (reminderType === 'expiry' && action === 'continue') {
      await requestStoreReview();
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.closeButton} onPress={() => handleClose('close')}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>
          This wrap-up screen is now generic. Replace it with the strongest reminder of what users keep when they stay subscribed.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => handleClose('continue')}>
          <Text style={styles.primaryButtonText}>Continue to App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryLink} onPress={() => Linking.openURL(getSubscriptionManagementURL())}>
          <Text style={styles.secondaryLinkText}>Manage subscription</Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.cardList}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Template note</Text>
            </View>
            <Text style={styles.cardText}>
              Use this screen to recap progress, reinforce habit value, or preview what users lose after the trial.
            </Text>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={20} color={colors.warning} />
              <Text style={styles.cardTitle}>Reminder flow stays wired</Text>
            </View>
            <Text style={styles.cardText}>
              The template still supports notifications 2 days before expiry and again on the final day.
            </Text>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="build-outline" size={20} color={colors.success} />
              <Text style={styles.cardTitle}>What to customize</Text>
            </View>
            <Text style={styles.cardText}>
              Update the copy, proof points, support email, legal URLs, and any retention-specific incentives before shipping {appConfig.appName}.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  secondaryLinkText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardList: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
