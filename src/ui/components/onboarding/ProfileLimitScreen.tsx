import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { ProgressDots } from './ProgressDots';
import { Button } from '../Button';
import type { ProfileLimitScreenProps } from './types';

const GOAL_PRESETS = [
  {
    id: 'relaxed',
    label: 'Relaxed',
    value: 0.03,
    description: 'Light buzz - roughly 1-2 drinks',
    icon: 'water-outline' as const,
    color: colors.success,
  },
  {
    id: 'social',
    label: 'Social',
    value: 0.05,
    description: 'Feeling tipsy - roughly 2-3 drinks',
    icon: 'chatbubbles-outline' as const,
    color: colors.info,
  },
  {
    id: 'party',
    label: 'Party',
    value: 0.08,
    description: 'Strong effect - roughly 3-4 drinks',
    icon: 'sparkles-outline' as const,
    color: colors.wine,
  },
];

export { GOAL_PRESETS };

export function ProfileLimitScreen({ onBack, progress, selectedGoalPreset, onGoalPresetSelect, onGoalSubmit }: ProfileLimitScreenProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Set Your Personal Limit</Text>
        <Text style={styles.subtitle}>
          This will be your target in the real-time monitor. You can change it anytime.
        </Text>

        <View style={styles.presetsContainer}>
          {GOAL_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                selectedGoalPreset === preset.id && styles.presetCardSelected,
              ]}
              onPress={() => onGoalPresetSelect(preset.id)}
            >
              <View style={styles.presetHeader}>
                <View style={[
                  styles.presetIcon,
                  selectedGoalPreset === preset.id && { backgroundColor: `${preset.color}20` },
                ]}>
                  <Ionicons
                    name={preset.icon}
                    size={24}
                    color={selectedGoalPreset === preset.id ? preset.color : colors.textSecondary}
                  />
                </View>
                <View style={styles.presetInfo}>
                  <Text style={[
                    styles.presetLabel,
                    selectedGoalPreset === preset.id && styles.presetLabelSelected,
                  ]}>
                    {preset.label}
                    <Text style={styles.presetValue}> ({preset.value.toFixed(2)}%)</Text>
                  </Text>
                  <Text style={styles.presetDescription}>{preset.description}</Text>
                </View>
                {selectedGoalPreset === preset.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            These are estimates based on average metabolism. Your actual experience may vary.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ProgressDots current={progress.current} total={progress.total} />
        <Button
          title="Continue"
          onPress={onGoalSubmit}
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
  presetsContainer: {
    gap: spacing.md,
  },
  presetCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  presetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  presetInfo: {
    flex: 1,
  },
  presetLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  presetLabelSelected: {
    color: colors.primary,
  },
  presetValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: colors.textSecondary,
  },
  presetDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.info}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
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
