/**
 * CountdownTimer — Displays a countdown to a deadline in HH:MM:SS format.
 * Used in the influencer paywall variant to create urgency.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';

interface CountdownTimerProps {
  /** The deadline to count down to */
  deadline: Date;
}

function getTimeLeft(deadline: Date) {
  const diff = Math.max(0, deadline.getTime() - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { hours, minutes, seconds };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Offer expires in</Text>
      <View style={styles.timerRow}>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(timeLeft.hours)}</Text>
          <Text style={styles.timeLabel}>HRS</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(timeLeft.minutes)}</Text>
          <Text style={styles.timeLabel}>MIN</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(timeLeft.seconds)}</Text>
          <Text style={styles.timeLabel}>SEC</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.error,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeUnit: {
    alignItems: 'center',
    backgroundColor: `${colors.error}10`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 56,
  },
  timeValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.error,
    letterSpacing: 1,
    marginTop: 2,
  },
  separator: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
});
