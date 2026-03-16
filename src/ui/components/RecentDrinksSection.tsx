import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { RecentDrinkTemplate, DrinkType } from '../../domain/models/types';
import { useAppStore } from '../hooks/useAppStore';
import { formatVolumeCompact } from '../../domain/utils/volumeConversion';

// Icon mapping for drink types
const drinkTypeIcons: Record<DrinkType, string> = {
  beer_small: 'beer-outline',
  beer_large: 'beer',
  wine: 'wine-outline',
  longdrink: 'cafe-outline',
  shot: 'flask-outline',
  custom: 'create-outline',
};

// Color mapping for drink types
const drinkTypeColors: Record<DrinkType, string> = {
  beer_small: '#F59E0B',
  beer_large: '#F59E0B',
  wine: '#8B5CF6',
  longdrink: '#3B82F6',
  shot: '#EC4899',
  custom: '#6B7280',
};

interface RecentDrinksSectionProps {
  templates: RecentDrinkTemplate[];
  onInstantAdd: (template: RecentDrinkTemplate) => void;
  onSelectForEdit: (template: RecentDrinkTemplate) => void;
}

export function RecentDrinksSection({
  templates,
  onInstantAdd,
  onSelectForEdit,
}: RecentDrinksSectionProps) {
  const volumeUnit = useAppStore(state => state.profile?.volumeUnit ?? 'ml');

  if (templates.length === 0) {
    return null;
  }

  // Get display label for a template
  const getDisplayLabel = (template: RecentDrinkTemplate): string => {
    if (template.label) {
      return template.label;
    }
    switch (template.type) {
      case 'beer_small':
        return 'Beer';
      case 'beer_large':
        return 'Beer';
      case 'wine':
        return 'Wine';
      case 'longdrink':
        return 'Mixed Drink';
      case 'shot':
        return 'Shot';
      default:
        return 'Custom Drink';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>RECENT</Text>
      <View style={styles.grid}>
        {templates.map((template) => {
          const iconName = drinkTypeIcons[template.type] || 'wine-outline';
          const iconColor = drinkTypeColors[template.type] || colors.textSecondary;

          return (
            <TouchableOpacity
              key={template.id}
              style={styles.card}
              onPress={() => onSelectForEdit(template)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                  <Ionicons name={iconName as any} size={20} color={iconColor} />
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.cardLabel} numberOfLines={1}>
                    {getDisplayLabel(template)}
                  </Text>
                  <Text style={styles.cardSubLabel}>
                    {formatVolumeCompact(template.volumeMl, volumeUnit)} · {template.abvPercent}%
                  </Text>
                </View>
              </View>

              {/* Instant Add Button */}
              <TouchableOpacity
                style={styles.instantAddButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onInstantAdd(template);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  cardSubLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  instantAddButton: {
    marginLeft: spacing.xs,
  },
});
