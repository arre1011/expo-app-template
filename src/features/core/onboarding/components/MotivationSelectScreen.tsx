import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';
import { ProgressDots } from './ProgressDots';
import { Button } from '@/ui/components';
import { UserMotivation } from '../types';
import type { MotivationSelectScreenProps } from './types';

const MOTIVATION_OPTIONS: { id: UserMotivation; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'save_time', label: 'Save time and mental overhead', icon: 'timer-outline', color: colors.warning },
  { id: 'build_routine', label: 'Build a stronger routine', icon: 'repeat-outline', color: colors.primary },
  { id: 'reduce_stress', label: 'Reduce friction and stress', icon: 'leaf-outline', color: colors.success },
  { id: 'feel_better', label: 'Feel better day to day', icon: 'happy-outline', color: colors.yellow },
  { id: 'improve_focus', label: 'Improve focus and clarity', icon: 'flash-outline', color: colors.info },
  { id: 'stay_consistent', label: 'Stay consistent over time', icon: 'checkmark-done-outline', color: colors.success },
  { id: 'reach_personal_goal', label: 'Reach a personal goal faster', icon: 'flag-outline', color: colors.wine },
];

export function MotivationSelectScreen({ onBack, progress, selectedMotivations, onMotivationToggle, onMotivationsSubmit }: MotivationSelectScreenProps) {
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
        <Text style={styles.title}>Motivation Placeholder</Text>
        <Text style={styles.subtitle}>Swap these with the reasons your users actually care about.</Text>

        <View style={styles.list}>
          {MOTIVATION_OPTIONS.map((option) => {
            const isSelected = selectedMotivations.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.item,
                  isSelected && { backgroundColor: `${option.color}15` },
                ]}
                onPress={() => onMotivationToggle(option.id)}
              >
                <View style={[
                  styles.itemIcon,
                  { backgroundColor: `${option.color}15` },
                  isSelected && { backgroundColor: `${option.color}25` },
                ]}>
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <Text style={[
                  styles.itemText,
                  isSelected && { fontWeight: fontWeight.medium, color: option.color },
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={option.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ProgressDots current={progress.current} total={progress.total} />
        <Button
          title={selectedMotivations.length > 0 ? 'Continue' : 'Skip'}
          onPress={onMotivationsSubmit}
          size="large"
          style={selectedMotivations.length > 0 ? styles.buttonReady : styles.button}
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
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
