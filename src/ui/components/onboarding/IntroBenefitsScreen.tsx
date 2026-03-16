import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { OnboardingScreenProps } from './types';

export function IntroBenefitsScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="See it in action"
        onPress={onNext}
        size="large"
        style={styles.button}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.success}15` }]}>
          <Ionicons name="checkmark-circle-outline" size={80} color={colors.success} />
        </View>
        <Text style={styles.title}>Here's what that{'\n'}means for you.</Text>
        <View style={styles.listContainer}>
          <View style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </View>
            <Text style={styles.itemText}>Live alcohol level tracking — the #1 proven method</Text>
          </View>
          <View style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </View>
            <Text style={styles.itemText}>Your personal limit, not a program's rules</Text>
          </View>
          <View style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </View>
            <Text style={styles.itemText}>One nudge when it matters</Text>
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
  title: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  listContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  button: {
    width: '100%',
  },
});
