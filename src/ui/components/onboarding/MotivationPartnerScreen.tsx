import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { OnboardingScreenProps } from './types';

export function MotivationPartnerScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="Start my journey"
        onPress={onNext}
        size="large"
        style={styles.buttonReady}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.yellow}15` }]}>
          <Ionicons name="sunny-outline" size={80} color={colors.yellow} />
        </View>

        <Text style={styles.title}>Your best{'\n'}Saturday morning.</Text>

        <Text style={styles.description}>
          You wake up clear-headed.{'\n'}You remember the whole night.{'\n'}You had a great time — and you chose how it went.{'\n\n'}That's not luck. That's GlassCount.
        </Text>

        <View style={styles.savingsCard}>
          <Text style={styles.savingsCardTitle}>Fun Fact</Text>
          <Text style={styles.savingsCardText}>
            People who track their drinking save an average of $48–72 per month on drinks they didn't even want. That's your GlassCount subscription paying for itself.
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
  title: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  savingsCard: {
    backgroundColor: `${colors.success}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  savingsCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  savingsCardText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonReady: {
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
