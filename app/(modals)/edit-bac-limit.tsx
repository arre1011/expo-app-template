import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import WheelPicker from '@quidone/react-native-wheel-picker';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { ModalHeader } from '../../src/ui/components';
import { useAppStore } from '../../src/ui/hooks/useAppStore';

const LIMIT_PRESETS = [
  { value: 0.3, description: '1-2 drinks' },
  { value: 0.5, description: '2-3 drinks' },
  { value: 0.8, description: '3-4 drinks' },
];

export default function EditBACLimitModal() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { todayGoal, setTodayGoal } = useAppStore();
  const [bacLimit, setBacLimit] = useState(todayGoal?.maxBAC ?? 0.5);
  const [isSaving, setIsSaving] = useState(false);

  const snapPoints = useMemo(() => ['70%'], []);

  // Generate BAC values from 0.1 to 3.0 in 0.1 steps
  const bacItems = useMemo(() => {
    const items: { value: number; label: string }[] = [];
    for (let i = 1; i <= 30; i++) {
      const value = i / 10;
      items.push({ value, label: value.toFixed(2) });
    }
    return items;
  }, []);

  // Present modal on mount
  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      router.back();
    }
  }, []);

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
      await setTodayGoal(bacLimit, true);
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to update BAC limit:', error);
      Alert.alert('Error', 'Could not save limit.');
      setIsSaving(false);
    }
  };

  const handleWheelChange = useCallback(({ item }: { item: { value: number } }) => {
    setBacLimit(item.value);
  }, []);

  return (
    <View style={styles.container}>
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
                    value={bacLimit}
                    onValueChanged={handleWheelChange}
                    itemHeight={50}
                    visibleItemCount={5}
                    itemTextStyle={styles.pickerItemText}
                  />
                </View>
                <Text style={styles.pickerUnit}>%</Text>
              </View>
            </View>

            {/* Quick Select Presets */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsTitle}>Quick Select</Text>
              <View style={styles.presetsGrid}>
                {LIMIT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetButton,
                      bacLimit === preset.value && styles.presetButtonActive,
                    ]}
                    onPress={() => setBacLimit(preset.value)}
                  >
                    <Text
                      style={[
                        styles.presetButtonValue,
                        bacLimit === preset.value && styles.presetButtonValueActive,
                      ]}
                    >
                      {preset.value.toFixed(2)}%
                    </Text>
                    <Text style={styles.presetButtonDescription}>
                      {preset.description}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    height: 200,
  },
  pickerItemText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
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
  presetButtonDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
