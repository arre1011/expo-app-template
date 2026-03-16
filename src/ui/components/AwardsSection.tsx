/**
 * AwardsSection - Awards display for Calendar Tab
 *
 * Shows:
 * - Section title "Your Achievements"
 * - Streak cards (Limit Keeper, Mindful Drinker)
 *
 * Each card is clickable and opens a beautiful bottom sheet with details.
 */

import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { AwardId, AwardState } from '../../domain/models/types';
import {
  AWARD_DEFINITIONS,
  TIER_COLORS,
  TIER_BG_COLORS,
  PHASE2_AWARDS,
  getTierLabel,
} from '../../domain/constants/awardDefinitions';
import { useAllAwards, useAwardsLoading } from '../hooks/useAwardsStore';
import { AwardDetailSheet } from './AwardDetailSheet';

// ============================================================================
// Main Component
// ============================================================================

export function AwardsSection() {
  const awards = useAllAwards();
  const isLoading = useAwardsLoading();
  const detailSheetRef = useRef<BottomSheetModal>(null);
  const [selectedAwardId, setSelectedAwardId] = useState<AwardId | null>(null);

  const handleCardPress = useCallback((awardId: AwardId) => {
    setSelectedAwardId(awardId);
    detailSheetRef.current?.present();
  }, []);

  if (isLoading || Object.keys(awards).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="trophy-outline" size={32} color={colors.textLight} />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  // Get streak awards (all active awards are streak awards now)
  const streakAwards = PHASE2_AWARDS
    .map(id => awards[id])
    .filter(a => a !== undefined);

  return (
    <View style={styles.container}>
      {/* Section Title with Beta Badge */}
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Your Achievements</Text>
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>BETA</Text>
        </View>
      </View>

      {/* Streak Cards */}
      <View style={styles.cardsList}>
        {streakAwards.map(award => (
          <StreakAwardCard
            key={award.awardId}
            award={award}
            onPress={() => handleCardPress(award.awardId)}
          />
        ))}
      </View>

      {/* Detail Sheet - uses awardId to fetch fresh data from store */}
      <AwardDetailSheet ref={detailSheetRef} awardId={selectedAwardId} />
    </View>
  );
}

// ============================================================================
// Streak Award Card
// ============================================================================

interface AwardCardProps {
  award: AwardState;
  onPress: () => void;
}

function StreakAwardCard({ award, onPress }: AwardCardProps) {
  const definition = AWARD_DEFINITIONS[award.awardId];

  // Colors based on tier
  const tierColor = award.currentTier
    ? TIER_COLORS[award.currentTier]
    : colors.streakActive;
  const tierBgColor = award.currentTier
    ? TIER_BG_COLORS[award.currentTier]
    : colors.streakActiveBg;

  // Tier label
  const tierLabel = getTierLabel(award.currentTier);

  const unit = award.awardId === 'mindful_drinker' ? 'sessions' : 'days';
  const unitSingular = award.awardId === 'mindful_drinker' ? 'Session' : 'Day';
  const remaining = award.nextMilestoneValue - award.currentStreak;
  const isGoalReached = remaining <= 0;

  // Ensure progressPercent is a valid number (fallback to calculated value)
  const progressPercent = typeof award.progressPercent === 'number' && !isNaN(award.progressPercent)
    ? award.progressPercent
    : Math.round((award.currentStreak / award.nextMilestoneValue) * 100);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: Icon with Tier Badge */}
      <View style={styles.iconWrapper}>
        <View style={[styles.iconContainer, { backgroundColor: tierColor + '20' }]}>
          <Ionicons
            name={definition.icon as any}
            size={24}
            color={tierColor}
          />
        </View>
        {/* Tier Level Badge */}
        <View style={[styles.tierBadge, { backgroundColor: tierBgColor, borderColor: tierColor }]}>
          <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel}</Text>
        </View>
      </View>

      {/* Middle: Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{definition.name}</Text>
          {award.bestStreak > 0 && (
            <View style={styles.bestBadge}>
              <Ionicons name="trophy" size={10} color={colors.awardGold} />
              <Text style={styles.bestBadgeText}>{award.bestStreak}</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardProgress}>
          {isGoalReached ? (
            <Text style={styles.goalReached}>
              {award.currentStreak} {unit} reached!
            </Text>
          ) : (
            <>
              {unitSingular} {award.currentStreak}{' '}
              <Text style={styles.cardProgressLabel}>of {award.nextMilestoneValue}</Text>
            </>
          )}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: colors.sober,
              },
            ]}
          />
        </View>
      </View>

      {/* Right: Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  betaBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  betaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.background,
    letterSpacing: 0.5,
  },
  cardsList: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.awardGoldBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 2,
  },
  bestBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.awardGold,
  },
  cardProgress: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: 2,
  },
  cardProgressLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.textSecondary,
  },
  goalReached: {
    color: colors.success,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
