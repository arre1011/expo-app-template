import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { ProgressDots } from './ProgressDots';
import { Button } from '../Button';
import { UserMotivation } from '../../../domain/models/types';
import type { MotivationSelectScreenProps } from './types';

const MOTIVATION_OPTIONS: { id: UserMotivation; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'active_weekends', label: 'Enjoy active, hangover-free weekends', icon: 'sunny-outline', color: colors.yellow },
  { id: 'healthier_lifestyle', label: 'Live a healthier lifestyle', icon: 'heart-outline', color: colors.error },
  { id: 'mental_health', label: 'Improve my mental wellbeing', icon: 'happy-outline', color: colors.warning },
  { id: 'physical_health', label: 'Boost my physical health', icon: 'fitness-outline', color: colors.success },
  { id: 'productivity', label: 'Increase my productivity', icon: 'trending-up-outline', color: colors.info },
  { id: 'regain_control', label: 'Strengthen control over my choices', icon: 'shield-checkmark-outline', color: colors.wine },
  { id: 'mindful_consumption', label: 'Drink more consciously and mindfully', icon: 'leaf-outline', color: colors.success },
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
        <Text style={styles.title}>Your Motivation</Text>
        <Text style={styles.subtitle}>Select all that apply</Text>

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
