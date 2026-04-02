/**
 * Subscription Wall
 *
 * Full-screen hard paywall shown when the user has a profile but no active subscription.
 * This screen is not dismissible — the user must subscribe or restore purchases to proceed.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { appConfig } from '@/config/appConfig';
import { colors } from '@/ui/theme';
import { PaywallContent } from '@/features/core/subscription/components/PaywallContent';

export default function SubscriptionWall() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PaywallContent
        title={`Unlock ${appConfig.appName}`}
        subtitle="Subscribe to continue using the full template"
        showBackButton={false}
        onPurchaseSuccess={() => router.replace('/(tabs)')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
