/**
 * StreakCard - Reusable component for displaying any streak award
 *
 * Used in:
 * - Calendar Tab (both Limit Keeper and Mindful Drinker streaks)
 * - Statistics Tab (AwardsSection)
 *
 * Single source of truth for streak card UI - changes here apply everywhere.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { AwardState } from '../../domain/models/types';
import { AWARD_DEFINITIONS, TIER_COLORS } from '../../domain/constants/awardDefinitions';

interface StreakCardProps {
  award: AwardState;
  /** Compact mode for smaller layouts */
  compact?: boolean;
}

/**
 * StreakCard displays a single streak award with:
 * - Goal header with "NEXT GOAL" label
 * - Personal best badge (gold)
 * - Icon + award name
 * - "Day X of Y" progress
 * - Progress bar
 * - Motivational text
 */
export function StreakCard({ award, compact = false }: StreakCardProps) {
  const definition = AWARD_DEFINITIONS[award.awardId];
  const progressColor = award.currentTier
    ? TIER_COLORS[award.currentTier]
    : colors.streakActive;

  // Calculate progress to next milestone
  const remaining = award.nextMilestoneValue - award.currentStreak;
  const isGoalReached = remaining <= 0;

  // Unit label based on award type
  const unit = award.awardId === 'mindful_drinker' ? 'sessions' : 'days';
  const unitSingular = award.awardId === 'mindful_drinker' ? 'Session' : 'Day';

  if (compact) {
    return (
      <View style={styles.containerCompact}>
        <View style={styles.headerCompact}>
          <Ionicons
            name={definition.icon as any}
            size={16}
            color={progressColor}
          />
          <Text style={styles.valueCompact}>
            {unitSingular} {award.currentStreak}
          </Text>
          <Text style={styles.labelCompact}>of {award.nextMilestoneValue}</Text>
        </View>
        <View style={styles.progressBarCompact}>
          <View
            style={[
              styles.progressFillCompact,
              {
                width: `${Math.min(award.progressPercent, 100)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Goal Header */}
      <View style={styles.goalHeader}>
        <Text style={styles.goalLabel}>NEXT GOAL</Text>
        {award.bestStreak > 0 && (
          <View style={styles.bestBadge}>
            <Ionicons name="trophy" size={12} color={colors.awardGold} />
            <Text style={styles.bestBadgeText}>Best: {award.bestStreak}</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Ionicons
          name={definition.icon as any}
          size={28}
          color={progressColor}
        />
        <View style={styles.textContent}>
          <Text style={styles.awardName}>{definition.name}</Text>
          <Text style={styles.streakValue}>
            {isGoalReached ? (
              <Text style={styles.goalReached}>
                🎉 {award.currentStreak} {unit}
              </Text>
            ) : (
              <>
                {unitSingular} {award.currentStreak}{' '}
                <Text style={styles.streakLabel}>of {award.nextMilestoneValue}</Text>
              </>
            )}
          </Text>
        </View>
        <Text style={styles.progressPercent}>{award.progressPercent}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(award.progressPercent, 100)}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>

      {/* Motivational Text */}
      <Text style={styles.hintText}>
        {isGoalReached
          ? `Milestone reached! Next: ${award.nextMilestoneValue} ${unit}`
          : `✨ ${remaining} ${remaining === 1 ? unit.slice(0, -1) : unit} to go!`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full size styles
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.awardGoldBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  bestBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.awardGold,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  textContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  awardName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  streakValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  streakLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: colors.textSecondary,
  },
  goalReached: {
    color: colors.success,
  },
  progressPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Compact styles
  containerCompact: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  valueCompact: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  labelCompact: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressBarCompact: {
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFillCompact: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
