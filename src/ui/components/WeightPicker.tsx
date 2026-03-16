import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { colors, fontSize, fontWeight, borderRadius } from '../theme';
import {
  WeightUnit,
  kgToLb,
  lbToKg,
  getWeightRange,
  clampWeight,
} from '../../domain/utils/weightConversion';

interface WeightPickerProps {
  /** Weight value in kg (internal storage format) */
  valueKg: number;
  /** Current display unit */
  unit: WeightUnit;
  /** Called when weight value changes (value is in kg) */
  onValueChange: (valueKg: number) => void;
  /** Called when unit changes */
  onUnitChange: (unit: WeightUnit) => void;
}

interface PickerItem {
  value: number | string;
  label: string;
}

export function WeightPicker({
  valueKg,
  unit,
  onValueChange,
  onUnitChange,
}: WeightPickerProps) {
  // Generate weight values for current unit
  const weightItems: PickerItem[] = useMemo(() => {
    const range = getWeightRange(unit);
    const items: PickerItem[] = [];
    for (let i = range.min; i <= range.max; i++) {
      items.push({ value: i, label: String(i) });
    }
    return items;
  }, [unit]);

  // Unit picker items
  const unitItems: PickerItem[] = useMemo(() => [
    { value: 'lb', label: 'lb' },
    { value: 'kg', label: 'kg' },
  ], []);

  // Get display value based on current unit
  const displayValue = useMemo(() => {
    if (unit === 'kg') {
      return clampWeight(Math.round(valueKg), 'kg');
    }
    return clampWeight(kgToLb(valueKg), 'lb');
  }, [valueKg, unit]);

  // Handle weight change
  const handleWeightChange = useCallback(({ item }: { item: { value: number } }) => {
    const selectedValue = item.value;
    // Convert to kg for storage
    if (unit === 'kg') {
      onValueChange(selectedValue);
    } else {
      onValueChange(lbToKg(selectedValue));
    }
  }, [unit, onValueChange]);

  // Handle unit change with automatic conversion
  const handleUnitChange = useCallback(({ item }: { item: { value: string } }) => {
    const newUnit = item.value as WeightUnit;
    if (newUnit === unit) return;

    // The value stays the same in kg, only the display changes
    // The displayValue will automatically update based on the new unit
    onUnitChange(newUnit);
  }, [unit, onUnitChange]);

  return (
    <View style={styles.container}>
      <View style={styles.pickersRow}>
        {/* Weight Value Picker */}
        <View style={styles.weightPickerContainer}>
          <WheelPicker
            data={weightItems}
            value={displayValue}
            onValueChanged={handleWeightChange}
            itemHeight={50}
            visibleItemCount={5}
            itemTextStyle={styles.pickerItemText}
            selectedIndicatorStyle={styles.selectedIndicator}
            containerStyle={styles.wheelContainer}
          />
        </View>

        {/* Unit Picker */}
        <View style={styles.unitPickerContainer}>
          <WheelPicker
            data={unitItems}
            value={unit}
            onValueChanged={handleUnitChange}
            itemHeight={50}
            visibleItemCount={5}
            itemTextStyle={styles.unitItemText}
            selectedIndicatorStyle={styles.selectedIndicator}
            containerStyle={styles.wheelContainer}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightPickerContainer: {
    width: 120,
    height: 250,
  },
  unitPickerContainer: {
    width: 80,
    height: 250,
  },
  wheelContainer: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  unitItemText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  selectedIndicator: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
});

export default WeightPicker;
