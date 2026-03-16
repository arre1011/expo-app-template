import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrinkEntry, DrinkType } from '../../domain/models/types';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAppStore } from '../hooks/useAppStore';
import { formatVolumeCompact } from '../../domain/utils/volumeConversion';
import { getDrinkById, CUSTOM_DRINK_COLOR, CUSTOM_DRINK_ICON } from '../../domain/constants/drinkCatalog';

interface DrinkListItemProps {
  drink: DrinkEntry;
  onPress?: () => void;
  onDelete?: () => void;
  showArrow?: boolean;
  /** Show absolute time (e.g. "18:45") instead of relative time only. Default: true */
  showAbsoluteTime?: boolean;
}

const drinkNames: Record<DrinkType, string> = {
  beer_small: 'Beer (small)',
  beer_large: 'Beer (large)',
  wine: 'Wine',
  longdrink: 'Mixed Drink',
  shot: 'Shot',
  custom: 'Custom Drink',
};

export function DrinkListItem({ drink, onPress, onDelete, showArrow = false, showAbsoluteTime = true }: DrinkListItemProps) {
  const volumeUnit = useAppStore(state => state.profile?.volumeUnit ?? 'ml');
  const customDrinks = useAppStore(state => state.customDrinks);
  const drinkTime = new Date(drink.timestamp);
  const drinkName = drink.label || drinkNames[drink.type] || 'Drink';

  // Get icon config - check catalog first, then custom drinks, then fallback
  const iconConfig = useMemo(() => {
    // First, try to get from catalog (works for catalog drinks)
    const catalogDrink = getDrinkById(drink.type);
    if (catalogDrink) {
      return { icon: catalogDrink.icon, color: catalogDrink.color };
    }

    // For custom type, try to find matching custom drink by label and properties
    if (drink.type === 'custom' && drink.label) {
      const matchingCustom = customDrinks.find(
        d => d.name === drink.label &&
             d.volumeMl === drink.volumeMl &&
             d.abvPercent === drink.abvPercent
      );
      if (matchingCustom) {
        return { icon: matchingCustom.icon, color: matchingCustom.color };
      }
    }

    // Fallback for custom drinks without a match
    return { icon: CUSTOM_DRINK_ICON, color: CUSTOM_DRINK_COLOR };
  }, [drink.type, drink.label, drink.volumeMl, drink.abvPercent, customDrinks]);

  // Use system locale for time format (respects 12h/24h setting)
  const timeLabel = drinkTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeAgo = formatDistanceToNow(drinkTime, { addSuffix: true, locale: enUS });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}20` }]}>
        <Ionicons
          name={iconConfig.icon as any}
          size={24}
          color={iconConfig.color}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{drinkName}</Text>
        <Text style={styles.details}>
          {formatVolumeCompact(drink.volumeMl, volumeUnit)}
          {' • '}
          {drink.abvPercent}% Vol.
        </Text>
      </View>

      <View style={styles.timeContainer}>
        {showAbsoluteTime ? (
          <>
            <Text style={styles.time}>{timeLabel}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </>
        ) : (
          <Text style={styles.timeAgoOnly}>{timeAgo}</Text>
        )}
      </View>

      {showArrow ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ) : onDelete ? (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color={colors.textLight} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  details: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  time: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  timeAgo: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeAgoOnly: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});
