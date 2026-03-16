/**
 * LimitWarningPopup - Warning overlay for BAC limit awareness
 *
 * Displays different messages based on warning type:
 * - will_exceed_limit: This drink would put you over your limit
 * - predictive_warning: If you drink another one soon, you'll exceed
 *
 * Based on harm-reduction principles:
 * - Non-judgmental tone
 * - Always allows user to proceed
 * - Provides helpful suggestions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { LimitWarningResult } from '../../domain/services/limitWarningService';
import { formatBACWithUnit } from '../../domain/utils/bacConversion';
import { useBACUnit } from '../hooks/useAppStore';
import { Button } from './Button';
import { posthog, AnalyticsEvents } from '../../services/analyticsService';

interface LimitWarningPopupProps {
  warning: LimitWarningResult | null;
  visible: boolean;
  onDismiss: () => void;         // User chooses alternative (water/pause)
  onProceed: () => void;         // User confirms to log anyway
}

export function LimitWarningPopup({
  warning,
  visible,
  onDismiss,
  onProceed,
}: LimitWarningPopupProps) {
  const bacUnit = useBACUnit();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && warning) {
      posthog.capture(AnalyticsEvents.LIMIT_POPUP_SHOWN, { type: warning.type });

      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Animation sequence
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, warning]);

  if (!warning || warning.type === 'none' || warning.type === 'approaching_limit') {
    return null;
  }

  const isExceeding = warning.type === 'will_exceed_limit';
  const isPredictive = warning.type === 'predictive_warning';

  // Helper to format BAC with user's preferred unit
  const formatBAC = (bac: number) => formatBACWithUnit(bac, bacUnit);

  // Generate content based on warning type
  const getContent = () => {
    if (isExceeding) {
      return {
        icon: 'alert-circle' as const,
        iconColor: colors.error, // Red for exceeding limit
        title: 'Limit Reached',
        message: `This drink would bring you to about ${formatBAC(warning.projectedBAC)}, which is over your limit of ${formatBAC(warning.limitValue)}.`,
        suggestion: 'Consider having some water or taking a short break.',
      };
    }

    if (isPredictive) {
      return {
        icon: 'information-circle' as const,
        iconColor: colors.warning, // Orange for predictive warning
        title: 'Heads Up',
        message: `One more drink like this would put you at ~${formatBAC(warning.predictedNextDrinkBAC!)}`,
        suggestion: `Take your time with this one. A pause afterwards would help you stay within your limit of ${formatBAC(warning.limitValue)}.`,
      };
    }

    return null;
  };

  const content = getContent();
  if (!content) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Prevent touches from closing modal when tapping content */}
          <TouchableOpacity activeOpacity={1} style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${content.iconColor}15` }]}>
              <Ionicons
                name={content.icon}
                size={40}
                color={content.iconColor}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>{content.title}</Text>

            {/* Message */}
            <Text style={styles.message}>{content.message}</Text>

            {/* Suggestion */}
            <Text style={styles.suggestion}>{content.suggestion}</Text>

            {/* Actions - different for predictive (informational) vs exceeding (confirmation) */}
            <View style={styles.actions}>
              {isPredictive ? (
                // Predictive warning: Drink is already saved, just dismiss
                <Button
                  title="Got It"
                  onPress={onDismiss}
                  size="large"
                  style={styles.primaryButton}
                  icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.textOnPrimary} />}
                />
              ) : (
                // Exceeding warning: Need confirmation before saving
                <>
                  <Button
                    title="Water First"
                    onPress={onDismiss}
                    size="large"
                    style={styles.primaryButton}
                    icon={<Ionicons name="water" size={20} color={colors.textOnPrimary} />}
                  />

                  <Button
                    title="Take a Break"
                    onPress={onDismiss}
                    variant="outline"
                    size="large"
                    style={styles.secondaryButton}
                    icon={<Ionicons name="timer-outline" size={20} color={colors.primary} />}
                  />

                  <TouchableOpacity
                    style={styles.proceedLink}
                    onPress={onProceed}
                  >
                    <Text style={styles.proceedLinkText}>
                      Log anyway
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Support message */}
            <Text style={styles.supportMessage}>
              You're in control. This is just a friendly reminder.
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  suggestion: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  proceedLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  proceedLinkText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  supportMessage: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
