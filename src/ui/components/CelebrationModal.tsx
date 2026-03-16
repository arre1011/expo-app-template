/**
 * CelebrationModal - Celebration overlay for new milestones
 *
 * Displays:
 * - Confetti-like animation effect
 * - Badge with tier color
 * - Milestone achievement message
 * - Dismiss button
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { AwardMilestone } from '../../domain/models/types';
import {
  AWARD_DEFINITIONS,
  TIER_COLORS,
  TIER_BG_COLORS,
} from '../../domain/constants/awardDefinitions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationModalProps {
  milestone: AwardMilestone | null;
  visible: boolean;
  onDismiss: () => void;
}

export function CelebrationModal({
  milestone,
  visible,
  onDismiss,
}: CelebrationModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && milestone) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
  }, [visible, milestone]);

  if (!milestone) return null;

  const definition = AWARD_DEFINITIONS[milestone.awardId];
  const tierColor = TIER_COLORS[milestone.tier];
  const tierBgColor = TIER_BG_COLORS[milestone.tier];

  const tierLabel = milestone.tier.charAt(0).toUpperCase() + milestone.tier.slice(1);

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
          {/* Decorative sparkles */}
          <View style={styles.sparkles}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: `${15 + (i % 4) * 23}%`,
                    top: `${10 + Math.floor(i / 4) * 70}%`,
                    backgroundColor: tierColor,
                    transform: [{ rotate: `${i * 45}deg` }],
                  },
                ]}
              />
            ))}
          </View>

          {/* Badge icon */}
          <View style={[styles.badgeContainer, { backgroundColor: tierBgColor }]}>
            <View style={[styles.badge, { borderColor: tierColor }]}>
              <Ionicons
                name={definition.icon as any}
                size={48}
                color={tierColor}
              />
            </View>
          </View>

          {/* Tier label */}
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{tierLabel}</Text>
          </View>

          {/* Achievement text */}
          <Text style={styles.title}>Milestone Reached!</Text>
          <Text style={styles.awardName}>{definition.name}</Text>
          <Text style={styles.milestoneValue}>
            {milestone.milestoneValue}{' '}
            {milestone.awardId === 'mindful_drinker' ? 'sessions' :
             milestone.awardId === 'perfect_week' ? 'weeks' : 'days'}
          </Text>
          <Text style={styles.description}>{definition.description}</Text>

          {/* Dismiss button */}
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Awesome!</Text>
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
    maxWidth: 320,
    position: 'relative',
    overflow: 'hidden',
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  tierText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  awardName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  milestoneValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 160,
  },
  dismissText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
});
