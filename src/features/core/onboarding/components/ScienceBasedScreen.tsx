import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '@/ui/components';
import type { OnboardingScreenProps } from './types';

export function ScienceBasedScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  return (
    <OnboardingLayout
      progress={progress}
      onBack={onBack}
      footer={
        <Button
          title="Continue"
          onPress={onNext}
          size="large"
          style={styles.button}
          icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
        />
      }
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.info}15` }]}>
          <Ionicons name="flask-outline" size={80} color={colors.info} />
        </View>

        <Text style={styles.screenLabel}>Screen 2</Text>
        <Text style={styles.title}>Science / Feature Placeholder</Text>
        <Text style={styles.description}>
          Use this screen for proof, social validation, or the first clear feature explanation.
          The goal is simple: reduce doubt before you ask for more commitment.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.cardText}>Show one sharp reason why your app works.</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.cardText}>Keep it specific, visual, and easy to scan.</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.cardText}>Replace this copy with your real positioning.</Text>
          </View>
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
    marginBottom: spacing.xl,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
});
