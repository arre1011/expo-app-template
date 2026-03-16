/**
 * AwardsDetailModal - Full awards overview in bottom sheet
 *
 * Shows:
 * - All award categories with progress
 * - Achieved milestones with dates
 * - Locked awards (greyed out)
 */

import React, { useMemo, forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ModalHeader } from './ModalHeader';
import { AwardState, AwardMilestone, AwardTier } from '../../domain/models/types';
import {
  AWARD_DEFINITIONS,
  AWARD_MILESTONES,
  TIER_COLORS,
  TIER_BG_COLORS,
  PHASE2_AWARDS,
  getCurrentTier,
} from '../../domain/constants/awardDefinitions';
import { useAllAwards } from '../hooks/useAwardsStore';

interface AwardsDetailModalProps {}

export const AwardsDetailModal = forwardRef<BottomSheetModal, AwardsDetailModalProps>(
  (props, ref) => {
    const awards = useAllAwards();
    const snapPoints = useMemo(() => ['90%'], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleClose = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [ref]);

    // Group awards by category
    const streakAwards = PHASE2_AWARDS
      .filter(id => AWARD_DEFINITIONS[id].category === 'streak')
      .map(id => awards[id])
      .filter(Boolean);

    const milestoneAwards = PHASE2_AWARDS
      .filter(id => AWARD_DEFINITIONS[id].category === 'milestone')
      .map(id => awards[id])
      .filter(Boolean);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.modalBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <ModalHeader title="Your Achievements" onClose={handleClose} />

        <BottomSheetScrollView style={styles.content}>
          {/* Streak Awards Section */}
          <Text style={styles.sectionTitle}>Streaks</Text>
          <Text style={styles.sectionDescription}>
            Consecutive achievements - keep the momentum going!
          </Text>
          <View style={styles.awardsList}>
            {streakAwards.map(award => (
              <AwardDetailCard key={award.awardId} award={award} />
            ))}
          </View>

          {/* Milestone Awards Section */}
          <Text style={styles.sectionTitle}>Milestones</Text>
          <Text style={styles.sectionDescription}>
            Cumulative achievements - every step counts!
          </Text>
          <View style={styles.awardsList}>
            {milestoneAwards.map(award => (
              <AwardDetailCard key={award.awardId} award={award} />
            ))}
          </View>

          {/* Bottom padding */}
          <View style={{ height: spacing.xxl }} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

// ============================================================================
// Sub-components
// ============================================================================

interface AwardDetailCardProps {
  award: AwardState;
}

function AwardDetailCard({ award }: AwardDetailCardProps) {
  const definition = AWARD_DEFINITIONS[award.awardId];
  const milestones = AWARD_MILESTONES[award.awardId];
  const currentTier = award.currentTier;
  const tierColor = currentTier ? TIER_COLORS[currentTier] : colors.textLight;

  return (
    <View style={styles.awardCard}>
      {/* Header */}
      <View style={styles.awardHeader}>
        <View style={[styles.awardIcon, { backgroundColor: tierColor + '20' }]}>
          <Ionicons
            name={definition.icon as any}
            size={28}
            color={tierColor}
          />
        </View>
        <View style={styles.awardInfo}>
          <Text style={styles.awardName}>{definition.name}</Text>
          <Text style={styles.awardDescription}>{definition.description}</Text>
        </View>
        <View style={styles.awardValue}>
          <Text style={[styles.awardValueNumber, { color: tierColor }]}>
            {award.currentStreak}
          </Text>
          {award.bestStreak > award.currentStreak && (
            <Text style={styles.awardBest}>Best: {award.bestStreak}</Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(award.progressPercent, 100)}%`,
                backgroundColor: tierColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {award.progressPercent}% to {award.nextMilestoneValue}
        </Text>
      </View>

      {/* Milestones badges */}
      <View style={styles.milestonesRow}>
        {milestones.map(milestoneValue => {
          const achieved = award.achievedMilestones.find(
            m => m.milestoneValue === milestoneValue
          );
          const isReached = award.currentStreak >= milestoneValue;
          const tier = getCurrentTier(award.awardId, milestoneValue);

          return (
            <MilestoneBadge
              key={milestoneValue}
              value={milestoneValue}
              tier={tier}
              isAchieved={!!achieved}
              isReached={isReached}
              achievedAt={achieved?.achievedAt}
            />
          );
        })}
      </View>
    </View>
  );
}

interface MilestoneBadgeProps {
  value: number;
  tier: AwardTier | null;
  isAchieved: boolean;
  isReached: boolean;
  achievedAt?: string;
}

function MilestoneBadge({
  value,
  tier,
  isAchieved,
  isReached,
  achievedAt,
}: MilestoneBadgeProps) {
  const bgColor = isAchieved && tier ? TIER_BG_COLORS[tier] : colors.backgroundSecondary;
  const borderColor = isAchieved && tier ? TIER_COLORS[tier] : colors.border;
  const textColor = isAchieved ? colors.text : colors.textLight;

  return (
    <View
      style={[
        styles.milestoneBadge,
        { backgroundColor: bgColor, borderColor },
        isAchieved && styles.milestoneBadgeAchieved,
      ]}
    >
      {isAchieved && (
        <Ionicons
          name="checkmark-circle"
          size={12}
          color={tier ? TIER_COLORS[tier] : colors.success}
          style={styles.milestoneBadgeCheck}
        />
      )}
      <Text style={[styles.milestoneBadgeValue, { color: textColor }]}>
        {value}
      </Text>
      {isAchieved && achievedAt && (
        <Text style={styles.milestoneBadgeDate}>
          {format(new Date(achievedAt), 'MMM d')}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: colors.background,
  },
  handleIndicator: {
    backgroundColor: colors.textLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  awardsList: {
    gap: spacing.md,
  },
  awardCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  awardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  awardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  awardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  awardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  awardValue: {
    alignItems: 'flex-end',
  },
  awardValueNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  awardBest: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressBarContainer: {
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  milestonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  milestoneBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 48,
  },
  milestoneBadgeAchieved: {
    borderWidth: 2,
  },
  milestoneBadgeCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.card,
    borderRadius: 6,
  },
  milestoneBadgeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  milestoneBadgeDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
