/**
 * Pro Feature Gate Component
 * Wraps features that require Pro subscription
 * Shows paywall when non-Pro users try to access
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useIsProUser } from '../hooks/useSubscriptionStore';
import { colors, spacing } from '../theme';

interface ProFeatureGateProps {
  children: React.ReactNode;
  featureName?: string;
  showUpgradePrompt?: boolean;
  customPrompt?: React.ReactNode;
  onProRequired?: () => void;
  style?: ViewStyle;
}

/**
 * Wraps children and only renders them if user has Pro access
 * Otherwise shows upgrade prompt or custom UI
 */
export function ProFeatureGate({
  children,
  featureName = 'This feature',
  showUpgradePrompt = true,
  customPrompt,
  onProRequired,
  style,
}: ProFeatureGateProps) {
  const isProUser = useIsProUser();

  if (isProUser) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onProRequired) {
      onProRequired();
    } else {
      router.push('/(modals)/paywall');
    }
  };

  if (customPrompt) {
    return <View style={style}>{customPrompt}</View>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.lockBadge}>
        <Text style={styles.lockIcon}>🔒</Text>
      </View>
      <Text style={styles.title}>Pro Feature</Text>
      <Text style={styles.message}>
        {featureName} is available with Pro subscription
      </Text>
      <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
        <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Higher-order component to wrap a screen with Pro gate
 */
export function withProFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    featureName?: string;
    redirectOnNoAccess?: boolean;
  }
) {
  return function ProGatedComponent(props: P) {
    const isProUser = useIsProUser();

    React.useEffect(() => {
      if (!isProUser && options?.redirectOnNoAccess) {
        router.replace('/(modals)/paywall');
      }
    }, [isProUser]);

    if (!isProUser) {
      return (
        <ProFeatureGate
          featureName={options?.featureName}
          showUpgradePrompt={!options?.redirectOnNoAccess}
        >
          <></>
        </ProFeatureGate>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Hook to check Pro access and navigate to paywall
 */
export function useProAccess() {
  const isProUser = useIsProUser();

  const requireProAccess = React.useCallback(
    (featureName?: string): boolean => {
      if (isProUser) {
        return true;
      }

      console.log(`🔒 ${featureName || 'Feature'} requires Pro access`);
      router.push('/(modals)/paywall');
      return false;
    },
    [isProUser]
  );

  return {
    isProUser,
    requireProAccess,
    navigateToPaywall: () => router.push('/(modals)/paywall'),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  lockBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  lockIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
