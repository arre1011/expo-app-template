import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';
import { Button } from '../Button';
import type { OnboardingScreenProps } from './types';

export function HowMonitoringScreen({ onNext, onBack, progress }: OnboardingScreenProps) {
  return (
    <OnboardingLayout progress={progress} onBack={onBack} footer={
      <Button
        title="Set up my profile"
        onPress={onNext}
        size="large"
        style={styles.button}
        icon={<Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
      />
    }>
      <View style={styles.content}>
        <Text style={styles.title}>This is your night —{'\n'}in real time.</Text>

        <View style={styles.chartContainer}>
          <Image
            source={require('../../../../assets/onboarding /Onboarding_chart.png')}
            style={styles.chartImage}
            resizeMode="contain"
          />
          <View style={styles.annotations}>
            <View style={styles.annotationItem}>
              <View style={[styles.annotationDot, { backgroundColor: colors.text }]} />
              <Text style={styles.annotationText}>Alcohol Level Curve - Your intake based on logged drinks</Text>
            </View>
            <View style={styles.annotationItem}>
              <View style={[styles.annotationDotDashed, { borderColor: colors.error }]} />
              <Text style={styles.annotationText}>Your limit — chosen by you</Text>
            </View>
            <View style={styles.annotationItem}>
              <View style={[styles.annotationDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.annotationText}>You are here</Text>
            </View>
            <View style={styles.annotationItem}>
              <View style={[styles.annotationDot, { backgroundColor: colors.success }]} />
              <Text style={styles.annotationText}>You'll be sober again</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description}>
          No more guessing how much is too much. GlassCount shows you exactly where you stand — and alerts you before you cross the line you drew yourself.
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartImage: {
    width: '100%',
    height: 200,
    marginBottom: spacing.md,
  },
  annotations: {
    gap: spacing.sm,
  },
  annotationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  annotationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  annotationDotDashed: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  annotationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
  },
});
