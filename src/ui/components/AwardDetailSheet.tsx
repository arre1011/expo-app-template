/**
 * AwardDetailSheet - Bottom sheet showing details for a single award
 *
 * Features:
 * - Slide-up animation for "wow" effect
 * - Large award icon with tier color
 * - Progress bar to next milestone
 * - Milestone badges with checkmarks for achieved ones
 */

import React, { forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { AwardId, AwardTier } from '../../domain/models/types';
import {
  AWARD_DEFINITIONS,
  AWARD_MILESTONES,
  TIER_COLORS,
  TIER_BG_COLORS,
  TIER_LABELS,
  TIER_ICONS,
  getTierForMilestoneIndex,
} from '../../domain/constants/awardDefinitions';
import { useAllAwards } from '../hooks/useAwardsStore';

interface AwardDetailSheetProps {
  awardId: AwardId | null;
}

export const AwardDetailSheet = forwardRef<BottomSheetModal, AwardDetailSheetProps>(
  ({ awardId }, ref) => {
    // Get current award data from store (reactive - updates when store changes)
    const awards = useAllAwards();
    const award = awardId ? awards[awardId] : null;

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

    if (!award || !awardId) return null;

    const definition = AWARD_DEFINITIONS[awardId];
    const milestones = AWARD_MILESTONES[awardId];
    // Use tier color if milestone reached, otherwise vibrant green for active progress
    const tierColor = award.currentTier ? TIER_COLORS[award.currentTier] : colors.streakActive;

    // Determine unit based on award type
    const unit = awardId === 'mindful_drinker' ? 'sessions' : 'days';

    const isStreak = definition.category === 'streak';

    // Ensure progressPercent is a valid number
    const progressPercent = typeof award.progressPercent === 'number' && !isNaN(award.progressPercent)
      ? award.progressPercent
      : Math.round((award.currentStreak / award.nextMilestoneValue) * 100);

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.modalBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.content}>
          {/* Large Icon */}
          <View style={[styles.iconContainer, { backgroundColor: tierColor + '20' }]}>
            <Ionicons
              name={definition.icon as any}
              size={48}
              color={tierColor}
            />
          </View>

          {/* Award Name & Description */}
          <Text style={styles.awardName}>{definition.name}</Text>
          <Text style={styles.awardDescription}>{definition.description}</Text>

          {/* Current Value */}
          <View style={styles.valueContainer}>
            <Text style={[styles.valueNumber, { color: tierColor }]}>
              {award.currentStreak}
            </Text>
            <Text style={styles.valueUnit}>{unit}</Text>
          </View>

          {/* Best Streak (for streak awards only) */}
          {isStreak && award.bestStreak > 0 && (
            <View style={styles.bestContainer}>
              <Ionicons name="trophy" size={16} color={colors.awardGold} />
              <Text style={styles.bestText}>Personal best: {award.bestStreak} {unit}</Text>
            </View>
          )}

          {/* Progress to Next Milestone */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              Progress to {award.nextMilestoneValue} {unit}
            </Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(progressPercent, 100)}%`,
                    backgroundColor: colors.sober,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progressPercent}%</Text>
          </View>

          {/* Milestones */}
          <Text style={styles.milestonesLabel}>Milestones</Text>
          <View style={styles.milestonesRow}>
            {milestones.map((milestoneValue, index) => {
              // Show as achieved based on CURRENT streak (more motivating)
              const isAchieved = award.currentStreak >= milestoneValue;
              // Get tier for THIS milestone (what tier it unlocks)
              const tier = getTierForMilestoneIndex(awardId, index);
              // Each milestone has its own tier label
              const tierLabel = TIER_LABELS[tier];

              return (
                <MilestoneBadge
                  key={milestoneValue}
                  value={milestoneValue}
                  tier={tier}
                  tierLabel={tierLabel}
                  isAchieved={isAchieved}
                />
              );
            })}
          </View>

          {/* Bottom padding for safe area */}
          <View style={{ height: spacing.xl }} />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

// ============================================================================
// Milestone Badge Component
// ============================================================================

interface MilestoneBadgeProps {
  value: number;
  tier: AwardTier;
  tierLabel: string;
  isAchieved: boolean;
}

function MilestoneBadge({
  value,
  tier,
  tierLabel,
  isAchieved,
}: MilestoneBadgeProps) {
  // Use tier-specific colors and icons
  const activeColor = TIER_COLORS[tier];
  const activeBgColor = TIER_BG_COLORS[tier];
  const tierIcon = TIER_ICONS[tier];

  const bgColor = isAchieved ? activeBgColor : colors.backgroundSecondary;
  const borderColor = isAchieved ? activeColor : colors.border;
  const textColor = isAchieved ? colors.text : colors.textLight;
  const labelColor = isAchieved ? activeColor : colors.textLight;
  const iconColor = isAchieved ? activeColor : colors.textLight;

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
          size={14}
          color={activeColor}
          style={styles.milestoneBadgeCheck}
        />
      )}
      {/* Tier Icon */}
      <Ionicons
        name={tierIcon as any}
        size={18}
        color={iconColor}
        style={styles.milestoneBadgeIcon}
      />
      {/* Tier Label */}
      <Text style={[styles.milestoneBadgeLabel, { color: labelColor }]}>
        {tierLabel}
      </Text>
      {/* Milestone Value */}
      <Text style={[styles.milestoneBadgeValue, { color: textColor }]}>
        {value}
      </Text>
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
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  awardName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  awardDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  valueNumber: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
    lineHeight: 64,
  },
  valueUnit: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  bestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.awardGoldBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  bestText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.awardGold,
  },
  progressSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    height: 10,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  milestonesLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  milestonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
    justifyContent: 'flex-start',
  },
  milestoneBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 56,
  },
  milestoneBadgeAchieved: {
    borderWidth: 2,
  },
  milestoneBadgeCheck: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: colors.background,
    borderRadius: 7,
  },
  milestoneBadgeIcon: {
    marginBottom: 2,
  },
  milestoneBadgeLabel: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  milestoneBadgeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
