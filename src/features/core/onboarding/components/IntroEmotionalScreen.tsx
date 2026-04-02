import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '@/ui/theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '@/ui/components';
import type { OnboardingScreenProps } from './types';

export function IntroEmotionalScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
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
        <Text style={styles.screenLabel}>Screen 1</Text>
        <Text style={styles.title}>Emotional Hook Placeholder</Text>
        <Text style={styles.description}>
          Replace this with the core feeling your app sells.
          Lead with emotion first, not explanation. The best version of this screen makes the user feel understood in under five seconds.
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
