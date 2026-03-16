import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { FilterChipType, FILTER_CHIP_CONFIG } from '../theme/drinkStyles';

interface CategoryChipsProps {
  selectedCategory: FilterChipType;
  onSelectCategory: (category: FilterChipType) => void;
  favoritesCount?: number;
  recentCount?: number;
  myDrinksCount?: number;
  showFavorites?: boolean;
}

// Simplified chip order: personalized categories only
const CHIP_ORDER: FilterChipType[] = ['favorites', 'recent', 'all', 'myDrinks'];

export function CategoryChips({
  selectedCategory,
  onSelectCategory,
  favoritesCount = 0,
  recentCount = 0,
  myDrinksCount = 0,
  showFavorites = true,
}: CategoryChipsProps) {
  // Filter chips based on visibility rules:
  // - favorites: only if showFavorites is true
  // - recent: only if recentCount > 0
  // - all: always visible
  // - myDrinks: only if myDrinksCount > 0
  const visibleChips = useMemo(() => {
    return CHIP_ORDER.filter(chip => {
      if (chip === 'favorites') return showFavorites;
      if (chip === 'recent') return recentCount > 0;
      if (chip === 'all') return true;
      if (chip === 'myDrinks') return myDrinksCount > 0;
      return false;
    });
  }, [showFavorites, recentCount, myDrinksCount]);

  const getChipColor = (chip: FilterChipType): string => {
    if (chip === 'favorites') return colors.primary;
    if (chip === 'recent') return colors.textSecondary;
    if (chip === 'all') return colors.text;
    if (chip === 'myDrinks') return colors.primary;
    return colors.text;
  };

  const getCount = (chip: FilterChipType): number | undefined => {
    if (chip === 'favorites') return favoritesCount;
    if (chip === 'recent') return recentCount;
    if (chip === 'myDrinks') return myDrinksCount;
    return undefined;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {visibleChips.map(chip => {
        const config = FILTER_CHIP_CONFIG[chip];
        const isSelected = selectedCategory === chip;
        const chipColor = getChipColor(chip);
        const count = getCount(chip);

        return (
          <TouchableOpacity
            key={chip}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              isSelected && { borderColor: chipColor },
            ]}
            onPress={() => onSelectCategory(chip)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={config.icon as any}
              size={16}
              color={isSelected ? chipColor : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
                isSelected && { color: chipColor },
              ]}
            >
              {config.label}
            </Text>
            {count !== undefined && count > 0 && (
              <View style={[styles.countBadge, isSelected && { backgroundColor: chipColor }]}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 36,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.background,
    borderWidth: 2,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    fontWeight: fontWeight.semibold,
  },
  countBadge: {
    backgroundColor: colors.textSecondary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
});
