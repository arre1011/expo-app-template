import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { ModalHeader } from '@/ui/components/ModalHeader';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';

interface WheelPickerExampleProps {
  open: boolean;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, '0') }));

export function WheelPickerExample({ open, onClose }: WheelPickerExampleProps) {
  const ref = useRef<BottomSheetModal>(null);
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);

  React.useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);

  const handleClose = useCallback(() => {
    ref.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  const handleSave = () => {
    Alert.alert('Selected', `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    ref.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.contentContainer}>
        <ModalHeader title="Pick a Time" onClose={handleClose} onSave={handleSave} />
        <View style={styles.content}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={styles.label}>Hours</Text>
              <WheelPicker
                data={HOURS}
                value={hours}
                onValueChanged={({ item }) => setHours(item.value)}
                itemHeight={50}
                visibleItemCount={5}
                containerStyle={styles.wheel}
                itemTextStyle={styles.wheelText}
                selectedIndicatorStyle={styles.selectedIndicator}
              />
            </View>

            <Text style={styles.separator}>:</Text>

            <View style={styles.pickerColumn}>
              <Text style={styles.label}>Minutes</Text>
              <WheelPicker
                data={MINUTES}
                value={minutes}
                onValueChanged={({ item }) => setMinutes(item.value)}
                itemHeight={50}
                visibleItemCount={5}
                containerStyle={styles.wheel}
                itemTextStyle={styles.wheelText}
                selectedIndicatorStyle={styles.selectedIndicator}
              />
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Selected time</Text>
            <Text style={styles.previewValue}>
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
            </Text>
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
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerColumn: {
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  wheel: {
    width: 100,
    height: 250,
  },
  wheelText: {
    fontSize: fontSize.xl,
    color: colors.text,
  },
  selectedIndicator: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  separator: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  preview: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});
