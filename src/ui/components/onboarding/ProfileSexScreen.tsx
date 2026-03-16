import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { ProfileSexScreenProps } from './types';

export function ProfileSexScreen({ onNext, onBack, progress, sex, onSexChange }: ProfileSexScreenProps) {
  const [sexError, setSexError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleSexChange = (value: 'male' | 'female' | 'other') => {
    onSexChange(value);
    setTouched(true);
    setSexError(null);
  };

  const handleContinue = () => {
    if (sex === null) {
      setSexError('Please select an option to continue');
      setTouched(true);
      return;
    }
    onNext();
  };

  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="Continue"
        onPress={handleContinue}
        size="large"
        style={sex !== null ? styles.buttonReady : styles.button}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <Text style={styles.title}>Personalize Your Experience</Text>
        <Text style={styles.subtitle}>
          For accurate alcohol level estimates, we need some information about you.
        </Text>

        <Text style={styles.sectionLabel}>Biological Profile</Text>
        <Text style={styles.sectionHint}>Different body types process alcohol differently</Text>

        <View style={styles.options}>
          {(['female', 'male', 'other'] as const).map((option) => {
            const isSelected = sex === option;
            const icon = option === 'female' ? 'female' : option === 'male' ? 'male' : 'person-outline';
            const label = option.charAt(0).toUpperCase() + option.slice(1);

            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSexChange(option)}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <Ionicons name={icon} size={28} color={isSelected ? colors.success : colors.textSecondary} />
                </View>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{label}</Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {sexError && touched && (
          <Text style={styles.errorText}>{sexError}</Text>
        )}
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
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  optionSelected: {
    backgroundColor: `${colors.success}15`,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  optionIconSelected: {
    backgroundColor: `${colors.success}25`,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  optionLabelSelected: {
    color: colors.success,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    width: '100%',
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
