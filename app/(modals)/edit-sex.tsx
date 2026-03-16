import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { Card, ModalHeader } from '../../src/ui/components';
import { useAppStore } from '../../src/ui/hooks/useAppStore';
import { Sex } from '../../src/domain/models/types';

export default function EditSexModal() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { profile, updateProfile } = useAppStore();
  const [selectedSex, setSelectedSex] = useState<Sex | null>(profile?.sex ?? null);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!selectedSex) {
      Alert.alert('No Selection', 'Please select your sex.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ sex: selectedSex });
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to update sex:', error);
      Alert.alert('Error', 'Could not save sex.');
      setIsSaving(false);
    }
  };

  const renderOption = (sex: NonNullable<Sex>, label: string, icon: string) => {
    const isSelected = selectedSex === sex;
    return (
      <TouchableOpacity
        key={sex}
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => setSelectedSex(sex)}
      >
        <View style={styles.optionContent}>
          <Ionicons
            name={icon as any}
            size={24}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
            {label}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing={true}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.contentContainer}>
          <ModalHeader
            title="Edit Sex"
            onClose={handleClose}
            onSave={handleSave}
            saveDisabled={!selectedSex || isSaving}
          />

          <View style={styles.content}>
            <Card style={styles.card}>
              {renderOption('male', 'Male', 'man-outline')}
              <View style={styles.divider} />
              {renderOption('female', 'Female', 'woman-outline')}
              <View style={styles.divider} />
              {renderOption('other', 'Other', 'person-outline')}
            </Card>

            <Text style={styles.hint}>
              Biological sex affects alcohol level calculation due to differences in body composition.
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
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight + '15',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabel: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },
});
