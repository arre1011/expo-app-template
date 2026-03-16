import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { colors, spacing, borderRadius } from '../../src/ui/theme';
import { ModalHeader, WeightPicker } from '../../src/ui/components';
import { useAppStore } from '../../src/ui/hooks/useAppStore';
import { WeightUnit, isValidWeight } from '../../src/domain/utils/weightConversion';

export default function EditWeightModal() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { profile, updateProfile } = useAppStore();

  // Initialize with current profile values
  const [weightKg, setWeightKg] = useState(profile?.weightKg ?? 75);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weightUnit ?? 'lb');
  const [isSaving, setIsSaving] = useState(false);

  const snapPoints = useMemo(() => ['55%'], []);

  // Present modal on mount
  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      router.replace('/(tabs)/settings');
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
    if (!isValidWeight(weightKg, 'kg')) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ weightKg, weightUnit });
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to update weight:', error);
      setIsSaving(false);
    }
  };

  const handleWeightValueChange = useCallback((newValueKg: number) => {
    setWeightKg(newValueKg);
  }, []);

  const handleWeightUnitChange = useCallback((newUnit: WeightUnit) => {
    setWeightUnit(newUnit);
  }, []);

  const isValid = isValidWeight(weightKg, 'kg');

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
            title="Edit Weight"
            onClose={handleClose}
            onSave={handleSave}
            saveDisabled={!isValid || isSaving}
          />

          <View style={styles.content}>
            <View style={styles.pickerWrapper}>
              <WeightPicker
                valueKg={weightKg}
                unit={weightUnit}
                onValueChange={handleWeightValueChange}
                onUnitChange={handleWeightUnitChange}
              />
            </View>
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
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  pickerWrapper: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
});
