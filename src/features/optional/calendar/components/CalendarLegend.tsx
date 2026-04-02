import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/ui/theme';

export interface DayStats {
  good: number;
  moderate: number;
  bad: number;
  total: number;
}

interface CalendarLegendProps {
  stats?: DayStats;
  showCounts?: boolean;
}

export const CalendarLegend = memo(function CalendarLegend({
  stats,
  showCounts = true,
}: CalendarLegendProps) {
  const showStats = showCounts && stats && stats.total > 0;

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.soberSoft }]} />
          <Text style={styles.legendLabel}>Good</Text>
          {showStats && <Text style={styles.legendCount}>{stats.good}</Text>}
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.moderateSoft }]} />
          <Text style={styles.legendLabel}>Moderate</Text>
          {showStats && <Text style={styles.legendCount}>{stats.moderate}</Text>}
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.overLimitSoft }]} />
          <Text style={styles.legendLabel}>Bad</Text>
          {showStats && <Text style={styles.legendCount}>{stats.bad}</Text>}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  legendCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.xs,
  },
});
