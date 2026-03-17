import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { ModalHeader } from '../ui/components/ModalHeader';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../ui/theme';

interface BottomSheetExampleProps {
  open: boolean;
  onClose: () => void;
}

export function BottomSheetExample({ open, onClose }: BottomSheetExampleProps) {
  const ref = useRef<BottomSheetModal>(null);

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
    Alert.alert('Saved', 'This is where you handle the save action.');
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
        <ModalHeader title="Example Modal" onClose={handleClose} onSave={handleSave} />
        <View style={styles.content}>
          <Text style={styles.heading}>Simple Bottom Sheet</Text>
          <Text style={styles.body}>
            This modal uses @gorhom/bottom-sheet with the standard ModalHeader component.
            It supports swipe-to-dismiss, a dark backdrop, and the [X] / [Save] header pattern.
          </Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Dynamic sizing: enabled</Text>
            <Text style={styles.infoText}>Pan down to close: enabled</Text>
            <Text style={styles.infoText}>Backdrop press: closes</Text>
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
    gap: spacing.md,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
});
