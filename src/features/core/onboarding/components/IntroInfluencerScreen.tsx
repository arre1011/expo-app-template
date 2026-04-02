import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '@/ui/components';
import { useOfferStore } from '@/features/core/subscription/state/useOfferStore';
import type { OnboardingScreenProps } from './types';

export function IntroInfluencerScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  const influencerName = useOfferStore((s) => s.influencerName);

  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="Continue"
        onPress={onNext}
        size="large"
        style={styles.button}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.yellow}15` }]}>
          <Ionicons name="sunny-outline" size={80} color={colors.yellow} />
        </View>

        {influencerName && (
          <View style={styles.referralBadge}>
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.referralText}>@{influencerName} sent you here</Text>
          </View>
        )}

        <Text style={styles.title}>Creator / Offer Placeholder</Text>
        <Text style={styles.description}>
          Use this variant when a campaign, creator, or special offer should slightly reframe the opening without rebuilding the full onboarding.
        </Text>
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
  referralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  referralText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
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
    marginBottom: spacing.sm,
  },
  button: {
    width: '100%',
  },
});
