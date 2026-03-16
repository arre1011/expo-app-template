import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { colors, spacing, borderRadius } from '../theme';
import { ModalHeader, WeightPicker } from '../components';
import { useAppStore } from '../hooks/useAppStore';
import { WeightUnit, isValidWeight } from '../../domain/utils/weightConversion';

interface EditWeightSheetProps {
  open: boolean;
  onClose: () => void;
}

export function EditWeightSheet({ open, onClose }: EditWeightSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { profile, updateProfile } = useAppStore();

  // Initialize with current profile values
  const [weightKg, setWeightKg] = useState(profile?.weightKg ?? 75);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weightUnit ?? 'lb');
  const [isSaving, setIsSaving] = useState(false);

  const snapPoints = useMemo(() => ['55%'], []);

  // Open/close based on `open` prop
  useEffect(() => {
    if (open) {
      // Reset to current profile values when opening
      setWeightKg(profile?.weightKg ?? 75);
      setWeightUnit(profile?.weightUnit ?? 'lb');
      setIsSaving(false);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open, profile?.weightKg, profile?.weightUnit]);

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
