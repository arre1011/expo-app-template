import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { featureFlags } from '../../config/featureFlags';
import { formatBACValue, getBACUnitSymbol } from '../../domain/utils/bacConversion';
import { useBACUnit } from '../hooks/useAppStore';

interface GoalProgressProps {
  currentBAC: number;
  maxBAC: number;
  onPress?: () => void;
}

export function GoalProgress({ currentBAC, maxBAC, onPress }: GoalProgressProps) {
  const bacUnit = useBACUnit();
  const unitSymbol = getBACUnitSymbol(bacUnit);
  const bacProgress = Math.min(currentBAC / maxBAC, 1);
  const bacAtLimit = currentBAC >= maxBAC;
  const bacOverLimit = currentBAC > maxBAC;

  const Container = onPress ? TouchableOpacity : View;

  // Compact layout: "Peak / Target 0.00 / 0.50% >"
  if (featureFlags.compactLimitCard) {
    return (
      <Container
        style={styles.container}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactLabel}>Peak / Limit</Text>
          <View style={styles.compactRight}>
            <View style={styles.countContainer}>
              <Text style={[styles.count, bacOverLimit && styles.countOver]}>
                {formatBACValue(currentBAC, bacUnit)}
              </Text>
              <Text style={styles.countDivider}> / </Text>
              <Text style={styles.countMax}>{formatBACValue(maxBAC, bacUnit)}</Text>
              <Text style={styles.countLabel}>{unitSymbol}</Text>
            </View>
            {onPress && (
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} style={styles.compactChevron} />
            )}
          </View>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${bacProgress * 100}%` },
              !bacOverLimit && styles.progressBarGreen,
              bacAtLimit && styles.progressBarAtLimit,
              bacOverLimit && styles.progressBarOver,
            ]}
          />
        </View>
      </Container>
    );
  }

  // Original layout
  return (
    <Container
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Limit</Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        )}
      </View>

      {/* BAC Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Daily Peak</Text>
          <View style={styles.countContainer}>
            <Text style={[styles.count, bacOverLimit && styles.countOver]}>
              {formatBACValue(currentBAC, bacUnit)}
            </Text>
            <Text style={styles.countDivider}> / </Text>
            <Text style={styles.countMax}>{formatBACValue(maxBAC, bacUnit)}</Text>
            <Text style={styles.countLabel}>{unitSymbol}</Text>
          </View>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${bacProgress * 100}%` },
              !bacOverLimit && styles.progressBarGreen,
              bacAtLimit && styles.progressBarAtLimit,
              bacOverLimit && styles.progressBarOver,
            ]}
          />
        </View>
      </View>

    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  progressSection: {
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  count: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  countOver: {
    color: colors.error,
  },
  countDivider: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  countMax: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  countLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressBarGreen: {
    backgroundColor: colors.success,
  },
  progressBarAtLimit: {
    backgroundColor: colors.warning,
  },
  progressBarOver: {
    backgroundColor: colors.error,
  },
  // Compact layout styles
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  compactLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactChevron: {
    marginLeft: spacing.sm,
  },
});
