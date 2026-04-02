import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/ui/theme';
import { ProgressDots } from './ProgressDots';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  progress: { current: number; total: number };
  onBack?: () => void;
}

export function OnboardingLayout({ children, footer, progress, onBack }: OnboardingLayoutProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {children}
      </View>

      <View style={styles.footer}>
        <ProgressDots current={progress.current} total={progress.total} />
        {footer}
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
  content: {
    flex: 1,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
