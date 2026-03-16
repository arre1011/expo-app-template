import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { CreateCustomDrink, VolumeUnit } from '../../domain/models/types';
import { Button } from './Button';
import { parseVolumeInput, getVolumeUnitLabel } from '../../domain/utils/volumeConversion';
import { CUSTOM_DRINK_COLOR, CUSTOM_DRINK_ICON } from '../../domain/constants/drinkCatalog';

// Available icons for custom drinks
const AVAILABLE_ICONS = [
  'beer-outline',
  'beer',
  'wine-outline',
  'wine',
  'cafe-outline',
  'flask-outline',
  'water-outline',
  'pint-outline',
];

// Available colors for custom drinks
const AVAILABLE_COLORS = [
  '#F59E0B', // Amber (Beer)
  '#8B5CF6', // Purple (Wine)
  '#EC4899', // Pink (Spirits)
  '#3B82F6', // Blue (Cocktails)
  '#10B981', // Green
  '#EF4444', // Red
  '#6B7280', // Gray
  '#F97316', // Orange
];

interface CustomDrinkFormProps {
  onSave: (drink: CreateCustomDrink) => Promise<void>;
  onCancel: () => void;
  volumeUnit?: VolumeUnit;
  isLoading?: boolean;
}

export function CustomDrinkForm({
  onSave,
  onCancel,
  volumeUnit = 'ml',
  isLoading = false,
}: CustomDrinkFormProps) {
  const [name, setName] = useState('');
  const [volume, setVolume] = useState('');
  const [abv, setAbv] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(CUSTOM_DRINK_ICON);
  const [selectedColor, setSelectedColor] = useState(CUSTOM_DRINK_COLOR);

  const [errors, setErrors] = useState<{
    name?: string;
    volume?: string;
    abv?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const volumeMl = parseVolumeInput(volume, volumeUnit);
    if (!volume || volumeMl === null || volumeMl <= 0) {
      newErrors.volume = 'Valid volume is required';
    } else if (volumeMl > 5000) {
      newErrors.volume = 'Volume seems too high';
    }

    const abvValue = parseFloat(abv);
    if (!abv || isNaN(abvValue) || abvValue <= 0) {
      newErrors.abv = 'Valid alcohol % is required';
    } else if (abvValue > 100) {
      newErrors.abv = 'Cannot exceed 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const volumeMl = parseVolumeInput(volume, volumeUnit)!;
    const abvPercent = parseFloat(abv);

    await onSave({
      name: name.trim(),
      volumeMl,
      abvPercent,
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Custom Drink</Text>

      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
          }}
          placeholder="e.g. My Special Cocktail"
          placeholderTextColor={colors.textLight}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Volume and ABV Row */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Volume ({getVolumeUnitLabel(volumeUnit)})</Text>
          <TextInput
            style={[styles.input, errors.volume && styles.inputError]}
            value={volume}
            onChangeText={(text) => {
              setVolume(text);
              if (errors.volume) setErrors(prev => ({ ...prev, volume: undefined }));
            }}
            keyboardType="numeric"
            placeholder={volumeUnit === 'oz' ? '11' : '330'}
            placeholderTextColor={colors.textLight}
          />
          {errors.volume && <Text style={styles.errorText}>{errors.volume}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Alcohol (%)</Text>
          <TextInput
            style={[styles.input, errors.abv && styles.inputError]}
            value={abv}
            onChangeText={(text) => {
              setAbv(text);
              if (errors.abv) setErrors(prev => ({ ...prev, abv: undefined }));
            }}
            keyboardType="decimal-pad"
            placeholder="5.0"
            placeholderTextColor={colors.textLight}
          />
          {errors.abv && <Text style={styles.errorText}>{errors.abv}</Text>}
        </View>
      </View>

      {/* Icon Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.iconRow}>
            {AVAILABLE_ICONS.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                  { backgroundColor: `${selectedColor}20` },
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={selectedIcon === icon ? selectedColor : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Color Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>
          {AVAILABLE_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
            <Ionicons name={selectedIcon as any} size={24} color={selectedColor} />
          </View>
          <View style={styles.previewContent}>
            <Text style={styles.previewName}>{name || 'Your Drink'}</Text>
            <Text style={styles.previewDetails}>
              {volume || '---'}{volumeUnit} · {abv || '---'}%
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Button
          title="Save Drink"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  previewContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  previewLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    marginLeft: spacing.md,
  },
  previewName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  previewDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
  },
});
