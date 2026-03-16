import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { ProfileVolumeScreenProps } from './types';

export function ProfileVolumeScreen({ onBack, progress, volumeUnit, onVolumeUnitChange, onSubmitProfile, isLoading }: ProfileVolumeScreenProps) {
  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="Continue"
        onPress={onSubmitProfile}
        loading={isLoading}
        size="large"
        style={styles.buttonReady}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <Text style={styles.title}>Volume Unit</Text>
        <Text style={styles.subtitle}>
          How would you like to measure your drinks?
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.option, volumeUnit === 'oz' && styles.optionSelected]}
            onPress={() => onVolumeUnitChange('oz')}
          >
            <View style={[styles.optionIcon, volumeUnit === 'oz' && styles.optionIconSelected]}>
              <Ionicons name="beaker-outline" size={32} color={volumeUnit === 'oz' ? colors.success : colors.textSecondary} />
            </View>
            <Text style={[styles.optionLabel, volumeUnit === 'oz' && styles.optionLabelSelected]}>Fluid Ounces</Text>
            <Text style={styles.optionExample}>e.g., 12 oz beer</Text>
            {volumeUnit === 'oz' && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, volumeUnit === 'ml' && styles.optionSelected]}
            onPress={() => onVolumeUnitChange('ml')}
          >
            <View style={[styles.optionIcon, volumeUnit === 'ml' && styles.optionIconSelected]}>
              <Ionicons name="flask-outline" size={32} color={volumeUnit === 'ml' ? colors.success : colors.textSecondary} />
            </View>
            <Text style={[styles.optionLabel, volumeUnit === 'ml' && styles.optionLabelSelected]}>Milliliters</Text>
            <Text style={styles.optionExample}>e.g., 330 ml beer</Text>
            {volumeUnit === 'ml' && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>
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
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  optionSelected: {
    backgroundColor: `${colors.success}15`,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionIconSelected: {
    backgroundColor: `${colors.success}25`,
  },
  optionLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  optionLabelSelected: {
    color: colors.success,
  },
  optionExample: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
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
