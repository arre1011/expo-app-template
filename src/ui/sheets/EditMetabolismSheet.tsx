import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { Card, ModalHeader } from '../components';
import { useAppStore } from '../hooks/useAppStore';
import { BAC_CONSTANTS } from '../../domain/constants/defaults';

type MetabolismRate = 'slow' | 'normal' | 'fast';

const METABOLISM_CONFIG: Record<MetabolismRate, { label: string; rate: number; description: string }> = {
  slow: {
    label: 'Slow',
    rate: BAC_CONSTANTS.ELIMINATION_RATE_SLOW,
    description: 'Alcohol is metabolized slower (~0.01%/h)',
  },
  normal: {
    label: 'Normal',
    rate: BAC_CONSTANTS.ELIMINATION_RATE_STANDARD,
    description: 'Average metabolism (~0.015%/h)',
  },
  fast: {
    label: 'Fast',
    rate: BAC_CONSTANTS.ELIMINATION_RATE_FAST,
    description: 'Alcohol is metabolized faster (~0.02%/h)',
  },
};

interface EditMetabolismSheetProps {
  open: boolean;
  onClose: () => void;
}

export function EditMetabolismSheet({ open, onClose }: EditMetabolismSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { profile, updateProfile } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const getCurrentMetabolismRate = (): MetabolismRate => {
    if (!profile) return 'normal';
    const rate = profile.eliminationRatePermillePerHour;
    if (rate <= BAC_CONSTANTS.ELIMINATION_RATE_SLOW) return 'slow';
    if (rate >= BAC_CONSTANTS.ELIMINATION_RATE_FAST) return 'fast';
    return 'normal';
  };

  const [selectedRate, setSelectedRate] = useState<MetabolismRate>(getCurrentMetabolismRate());

  // Open/close based on `open` prop
  useEffect(() => {
    if (open) {
      setSelectedRate(getCurrentMetabolismRate());
      setIsSaving(false);
      setShowInfo(false);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open, profile?.eliminationRatePermillePerHour]);

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
      await updateProfile({
        eliminationRatePermillePerHour: METABOLISM_CONFIG[selectedRate].rate,
      });
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to update metabolism rate:', error);
      Alert.alert('Error', 'Could not save metabolism setting.');
      setIsSaving(false);
    }
  };

  const renderOption = (rate: MetabolismRate) => {
    const config = METABOLISM_CONFIG[rate];
    const isSelected = selectedRate === rate;

    return (
      <TouchableOpacity
        key={rate}
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => setSelectedRate(rate)}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionIconContainer}>
            <Ionicons
              name="pulse-outline"
              size={24}
              color={isSelected ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
              {config.label}
            </Text>
            <Text style={styles.optionDescription}>{config.description}</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
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
          title="Edit Metabolism"
          onClose={handleClose}
          onSave={handleSave}
          saveDisabled={isSaving}
        />

        <View style={styles.content}>
          {/* Info Toggle */}
          <TouchableOpacity
            style={styles.infoToggle}
            onPress={() => setShowInfo(!showInfo)}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoToggleText}>
              {showInfo ? 'Hide info' : 'What does this mean?'}
            </Text>
          </TouchableOpacity>

          {showInfo && (
            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                The elimination rate describes how fast your body metabolizes alcohol.
                This value varies between individuals and depends on factors like age, weight,
                health, and genetics.
                {'\n\n'}
                Choose "Normal" if you're unsure. Most people metabolize alcohol
                at about 0.015% per hour.
              </Text>
            </Card>
          )}

          <Card style={styles.card}>
            {renderOption('slow')}
            <View style={styles.divider} />
            {renderOption('normal')}
            <View style={styles.divider} />
            {renderOption('fast')}
          </Card>

          <Text style={styles.hint}>
            This setting affects how long alcohol stays in your body based on the calculation.
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
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  infoToggleText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight + '15',
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
