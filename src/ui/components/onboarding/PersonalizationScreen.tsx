import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { ProgressDots } from './ProgressDots';
import { Button } from '../Button';
import type { PersonalizationScreenProps, PersonalizationOption } from './types';

const OPTIONS: Array<{
  id: PersonalizationOption;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  {
    id: 'guided',
    title: 'Guided Setup',
    description: 'Use a few smart questions to tailor the first experience.',
    icon: 'compass-outline',
    color: colors.primary,
  },
  {
    id: 'focused',
    title: 'Focused Outcome',
    description: 'Ask for only the one input that improves activation the most.',
    icon: 'flash-outline',
    color: colors.warning,
  },
  {
    id: 'lightweight',
    title: 'Skip Most Inputs',
    description: 'Keep onboarding light and personalize later if needed.',
    icon: 'sparkles-outline',
    color: colors.success,
  },
];

export function PersonalizationScreen({
  onBack,
  progress,
  selectedOption,
  onOptionSelect,
  onSubmit,
}: PersonalizationScreenProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Optional Personalization Placeholder</Text>
        <Text style={styles.subtitle}>
          Use this screen only if it clearly improves activation. If not, remove it from the flow.
        </Text>

        <View style={styles.optionList}>
          {OPTIONS.map((option) => {
            const isSelected = option.id === selectedOption;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && { borderColor: option.color, backgroundColor: `${option.color}10` },
                ]}
                onPress={() => onOptionSelect(option.id)}
              >
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                    <Ionicons name={option.icon} size={24} color={option.color} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, isSelected && { color: option.color }]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={24} color={option.color} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ProgressDots current={progress.current} total={progress.total} />
        <Button
          title="Continue"
          onPress={onSubmit}
          size="large"
          style={styles.button}
          icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  optionList: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  button: {
    width: '100%',
  },
});
