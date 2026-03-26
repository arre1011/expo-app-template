import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { OnboardingScreenProps } from './types';

export function PrePaywallHookScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  return (
    <OnboardingLayout
      progress={progress}
      onBack={onBack}
      footer={
        <Button
          title="See plans"
          onPress={onNext}
          size="large"
          style={styles.button}
          icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
        />
      }
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}15` }]}>
          <Ionicons name="heart-outline" size={80} color={colors.warning} />
        </View>

        <Text style={styles.screenLabel}>Before Paywall</Text>
        <Text style={styles.title}>Emotional Hook Placeholder</Text>
        <Text style={styles.description}>
          This is the moment to connect the user&apos;s motivation with the outcome your app promises.
          Keep it emotional, concrete, and short.
        </Text>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Template note</Text>
          <Text style={styles.noteText}>
            If you collected motivation or personalization data earlier, reuse it here to sharpen the transition into pricing.
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  screenLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 38,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  noteCard: {
    backgroundColor: `${colors.success}12`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  noteTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
