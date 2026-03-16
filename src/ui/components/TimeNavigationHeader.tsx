import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';

interface TimeNavigationHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  showGoToCurrentHint?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTapTitle?: () => void;
}

export function TimeNavigationHeader({
  title,
  subtitle,
  canGoBack = true,
  canGoForward = true,
  showGoToCurrentHint = false,
  onPrev,
  onNext,
  onTapTitle,
}: TimeNavigationHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
        onPress={onPrev}
        disabled={!canGoBack}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={canGoBack ? colors.primary : colors.textLight}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.titleContainer}
        onPress={onTapTitle}
        disabled={!onTapTitle}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {showGoToCurrentHint && (
          <Text style={styles.goToCurrentHint}>Tap for current</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
        onPress={onNext}
        disabled={!canGoForward}
      >
        <Ionicons
          name="chevron-forward"
          size={24}
          color={canGoForward ? colors.primary : colors.textLight}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  navButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goToCurrentHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
});
