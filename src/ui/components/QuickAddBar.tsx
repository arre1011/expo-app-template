import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { RecentDrinkTemplate, CustomDrink } from '../../domain/models/types';
import { useAppStore } from '../hooks/useAppStore';
import { formatVolumeCompact } from '../../domain/utils/volumeConversion';
import { getDrinkById, CUSTOM_DRINK_COLOR, CUSTOM_DRINK_ICON } from '../../domain/constants/drinkCatalog';
import { posthog, AnalyticsEvents } from '../../services/analyticsService';

interface QuickAddBarProps {
  templates: RecentDrinkTemplate[];
  onQuickAdd: (template: RecentDrinkTemplate) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}

// Individual card component with press feedback
function QuickAddCard({
  template,
  onQuickAdd,
  volumeUnit,
  customDrinks,
}: {
  template: RecentDrinkTemplate;
  onQuickAdd: (template: RecentDrinkTemplate) => Promise<void>;
  volumeUnit: 'ml' | 'oz';
  customDrinks: CustomDrink[];
}) {
  const [state, setState] = useState<'idle' | 'pressed' | 'success'>('idle');
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  // Get icon config - check catalog first, then custom drinks, then fallback
  const { iconName, iconColor } = useMemo(() => {
    // First, try to get from catalog (works for catalog drinks)
    const catalogDrink = getDrinkById(template.type);
    if (catalogDrink) {
      return { iconName: catalogDrink.icon, iconColor: catalogDrink.color };
    }

    // For custom type, try to find matching custom drink by label and properties
    if (template.type === 'custom' && template.label) {
      const matchingCustom = customDrinks.find(
        d => d.name === template.label &&
             d.volumeMl === template.volumeMl &&
             d.abvPercent === template.abvPercent
      );
      if (matchingCustom) {
        return { iconName: matchingCustom.icon, iconColor: matchingCustom.color };
      }
    }

    // Fallback for custom drinks without a match
    return { iconName: CUSTOM_DRINK_ICON, iconColor: CUSTOM_DRINK_COLOR };
  }, [template.type, template.label, template.volumeMl, template.abvPercent, customDrinks]);

  const getDisplayLabel = (t: RecentDrinkTemplate): string => {
    if (t.label) {
      return t.label.length > 12 ? t.label.substring(0, 10) + '...' : t.label;
    }
    switch (t.type) {
      case 'beer_small': return 'Beer';
      case 'beer_large': return 'Beer';
      case 'wine': return 'Wine';
      case 'longdrink': return 'Mixed';
      case 'shot': return 'Shot';
      default: return 'Custom';
    }
  };

  const handlePress = useCallback(async () => {
    if (state !== 'idle') return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Scale down animation
    setState('pressed');
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
    }).start();

    try {
      await onQuickAdd(template);
      posthog.capture(AnalyticsEvents.DRINK_ADDED, { type: template.type, source: 'quick_add' });

      // Success state with checkmark
      setState('success');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Scale back up
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      }).start();

      // Reset after showing success
      setTimeout(() => {
        setState('idle');
      }, 800);
    } catch {
      // Reset on error
      setState('idle');
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [state, template, onQuickAdd, scaleAnim]);

  const isSuccess = state === 'success';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.quickAddButton,
          isSuccess && styles.quickAddButtonSuccess,
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={state !== 'idle'}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: isSuccess ? `${colors.success}20` : `${iconColor}20` }
        ]}>
          {isSuccess ? (
            <Ionicons name="checkmark" size={22} color={colors.success} />
          ) : (
            <Ionicons name={iconName as any} size={20} color={iconColor} />
          )}
        </View>
        <Text style={[styles.buttonLabel, isSuccess && styles.buttonLabelSuccess]} numberOfLines={1}>
          {isSuccess ? 'Added!' : getDisplayLabel(template)}
        </Text>
        {!isSuccess && (
          <Text style={styles.buttonSubLabel}>
            {formatVolumeCompact(template.volumeMl, volumeUnit)}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function QuickAddBar({
  templates,
  onQuickAdd,
  style,
}: QuickAddBarProps) {
  const volumeUnit = useAppStore(state => state.profile?.volumeUnit ?? 'ml');
  const customDrinks = useAppStore(state => state.customDrinks);

  if (templates.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Recent Drinks</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {templates.map((template) => (
          <QuickAddCard
            key={template.id}
            template={template}
            onQuickAdd={onQuickAdd}
            volumeUnit={volumeUnit}
            customDrinks={customDrinks}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.md, // Extra padding at the end for visual boundary
  },
  quickAddButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickAddButtonSuccess: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  buttonLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  buttonLabelSuccess: {
    color: colors.success,
  },
  buttonSubLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
