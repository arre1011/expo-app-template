import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { getDrinkDisplayVolume } from '../../domain/utils/volumeConversion';
import { VolumeUnit } from '../../domain/models/types';

// Simple interface for drink display
interface DrinkDisplayItem {
  id: string;
  name: string;
  volumeMl: number;
  volumeOz?: number;
  abvPercent: number;
  icon: string;
  color: string;
  category?: string;
}

interface DrinkPickerItemProps {
  drink: DrinkDisplayItem;
  isFavorite: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  volumeUnit?: VolumeUnit;
  showFavorite?: boolean;
}

export function DrinkPickerItem({
  drink,
  isFavorite,
  isSelected,
  onSelect,
  onToggleFavorite,
  volumeUnit = 'ml',
  showFavorite = true,
}: DrinkPickerItemProps) {
  const drinkColor = drink.color;
  const drinkIcon = drink.icon;
  const drinkName = drink.name;
  const displayVolume = getDrinkDisplayVolume(drink.volumeMl, drink.volumeOz, volumeUnit);
  const volumeDisplay = `${displayVolume}${volumeUnit === 'oz' ? 'oz' : 'ml'}`;
  const isCustom = drink.id.startsWith('custom_');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${drinkColor}20` }]}>
        <Ionicons
          name={drinkIcon as any}
          size={24}
          color={drinkColor}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {drinkName}
          </Text>
          {isCustom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
        <Text style={styles.details}>
          {volumeDisplay} · {drink.abvPercent}%
        </Text>
      </View>

      {/* Favorite button */}
      {showFavorite && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={22}
            color={isFavorite ? colors.warning : colors.textLight}
          />
        </TouchableOpacity>
      )}

      {/* Arrow indicator - always show to indicate tap opens detail */}
      <View style={styles.arrowIndicator}>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  customBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  customBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  details: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  arrowIndicator: {
    marginLeft: spacing.xs,
  },
});
