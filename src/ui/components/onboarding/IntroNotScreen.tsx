import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { OnboardingScreenProps } from './types';

export function IntroNotScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="What does that mean for me?"
        onPress={onNext}
        size="large"
        style={styles.button}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.info}15` }]}>
          <Ionicons name="flask-outline" size={80} color={colors.info} />
        </View>
        <Text style={styles.title}>The #1 method — backed by 50+ experts.</Text>
        <Text style={styles.description}>
          Researchers across 50 countries agree: self-monitoring is the single most effective technique for drinking less.*{'\n\n'}Other apps count yesterday's drinks. GlassCount watches tonight — in real time.
        </Text>
        <Text style={styles.descriptionSmall}>*Source: JMIR mHealth study, 50+ international researchers</Text>
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
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  descriptionSmall: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    width: '100%',
  },
});
