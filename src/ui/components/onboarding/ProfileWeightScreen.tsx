import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import { WeightPicker } from '../WeightPicker';
import type { ProfileWeightScreenProps } from './types';

export function ProfileWeightScreen({ onNext, onBack, progress, weightKg, weightUnit, onWeightValueChange, onWeightUnitChange }: ProfileWeightScreenProps) {
  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="Continue"
        onPress={onNext}
        size="large"
        style={styles.buttonReady}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <Text style={styles.title}>Your Weight</Text>
        <Text style={styles.subtitle}>
          Weight helps us personalize your drink tracking.
        </Text>

        <View style={styles.pickerContainer}>
          <WeightPicker
            valueKg={weightKg}
            unit={weightUnit}
            onValueChange={onWeightValueChange}
            onUnitChange={onWeightUnitChange}
          />
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.success} />
          <Text style={styles.privacyNoteText}>Your data stays on your device</Text>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  pickerContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  privacyNoteText: {
    fontSize: fontSize.sm,
    color: colors.success,
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
