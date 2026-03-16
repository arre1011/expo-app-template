import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ModalHeader } from '../components';
import { useAppStore, useBACUnit } from '../hooks/useAppStore';
import {
  generateBACPickerValues,
  getBACUnitSymbol,
  bacToPermille,
  permilleToPickerValue,
  getBACPresets,
} from '../../domain/utils/bacConversion';
import { upsertDailyGoal } from '../../data/repositories/dailyGoalRepository';
import { drinkDataEvents } from '../hooks/drinkDataEvents';

interface EditBacLimitSheetProps {
  open: boolean;
  onClose: () => void;
  date?: string;          // yyyy-MM-dd — if provided, saves for that date instead of today
  initialMaxBAC?: number; // Starting value in permille — overrides todayGoal when date is set
  onSaved?: () => void;   // Called after successful save
}

export function EditBacLimitSheet({ open, onClose, date, initialMaxBAC, onSaved }: EditBacLimitSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { todayGoal, setTodayGoal } = useAppStore();
  const bacUnit = useBACUnit();
  const unitSymbol = getBACUnitSymbol(bacUnit);

  // Use initialMaxBAC (for past dates) or todayGoal (for today) as starting value
  const currentPermille = initialMaxBAC ?? todayGoal?.maxBAC ?? 0.5;
  const defaultDisplayValue = permilleToPickerValue(currentPermille, bacUnit);
  const [bacLimitDisplay, setBacLimitDisplay] = useState(defaultDisplayValue);
  const [isSaving, setIsSaving] = useState(false);

  const snapPoints = useMemo(() => ['70%'], []);

  // Generate BAC picker values based on user's unit preference
  const bacItems = useMemo(() => generateBACPickerValues(bacUnit), [bacUnit]);

  // Get presets based on user's unit preference
  const limitPresets = useMemo(() => getBACPresets(bacUnit), [bacUnit]);

  // Open/close based on `open` prop
  useEffect(() => {
    if (open) {
      // Use initialMaxBAC (past date) or todayGoal (today) as starting value
      const permille = initialMaxBAC ?? todayGoal?.maxBAC ?? 0.5;
      setBacLimitDisplay(permilleToPickerValue(permille, bacUnit));
      setIsSaving(false);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open, initialMaxBAC, todayGoal?.maxBAC, bacUnit]);

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const permilleValue = bacToPermille(bacLimitDisplay, bacUnit);
      if (date) {
        // Save for a specific date (e.g. past day from calendar)
        await upsertDailyGoal({ date, maxBAC: permilleValue, enabled: true });
        drinkDataEvents.notifyGoalsChanged();
        onSaved?.();
      } else {
        // Save for today (default behaviour)
        await setTodayGoal(permilleValue, true);
      }
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to update BAC limit:', error);
      Alert.alert('Error', 'Could not save limit.');
      setIsSaving(false);
    }
  };

  const handleWheelChange = useCallback(({ item }: { item: { value: number } }) => {
    setBacLimitDisplay(item.value);
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      enableContentPanningGesture={false}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.contentContainer}>
        <ModalHeader
          title="Alcohol Level Limit"
          onClose={handleClose}
          onSave={handleSave}
          saveDisabled={isSaving}
        />

        <View style={styles.content}>
          {/* Wheel Picker */}
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <View style={styles.wheelContainer}>
                <WheelPicker
                  data={bacItems}
                  value={bacLimitDisplay}
                  onValueChanged={handleWheelChange}
                  itemHeight={50}
                  visibleItemCount={5}
                  itemTextStyle={styles.pickerItemText}
                />
              </View>
              <View style={styles.unitContainer}>
                <Text style={styles.pickerUnit}>{unitSymbol}</Text>
              </View>
            </View>
          </View>

          {/* Quick Select Presets */}
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>Quick Select</Text>
            <View style={styles.presetsGrid}>
              {limitPresets.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    bacLimitDisplay === preset.value && styles.presetButtonActive,
                  ]}
                  onPress={() => setBacLimitDisplay(preset.value)}
                >
                  <Text
                    style={[
                      styles.presetButtonValue,
                      bacLimitDisplay === preset.value && styles.presetButtonValueActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.disclaimer}>
            Alcohol level limits are personal guidelines to help you drink mindfully.
            This is not a measure of fitness to drive.
          </Text>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.textLight,
    width: 40,
  },
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  // Wheel Picker styles
  pickerContainer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelContainer: {
    width: 120,
    height: 250, // 5 items * 50px itemHeight
  },
  pickerItemText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  unitContainer: {
    height: 250, // Match wheel picker height for proper alignment
    justifyContent: 'center',
  },
  pickerUnit: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  // Presets styles
  presetsContainer: {
    marginTop: spacing.xl,
  },
  presetsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  presetButtonValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  presetButtonValueActive: {
    color: colors.primary,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
