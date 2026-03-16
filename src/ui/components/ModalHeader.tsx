import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../theme';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  leftButton?: React.ReactNode;
  closeIcon?: 'close' | 'chevron-back';
}

export function ModalHeader({
  title,
  onClose,
  onSave,
  saveDisabled = false,
  saveLabel,
  leftButton,
  closeIcon = 'close',
}: ModalHeaderProps) {
  return (
    <View style={styles.header}>
      {leftButton ? (
        <View style={styles.closeButton}>
          {leftButton}
        </View>
      ) : (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {closeIcon === 'chevron-back' ? (
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          ) : (
            <View style={styles.iconCircle}>
              <Ionicons name="close" size={20} color={colors.text} />
            </View>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onSave ? (
        <TouchableOpacity
          onPress={onSave}
          style={styles.saveButton}
          disabled={saveDisabled}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {saveLabel ? (
            <Text style={[styles.saveLabel, saveDisabled && styles.saveLabelDisabled]}>
              {saveLabel}
            </Text>
          ) : (
            <View style={[styles.saveCircle, saveDisabled && styles.saveCircleDisabled]}>
              <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  closeButton: {
    width: 44,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  saveButton: {
    width: 44,
    alignItems: 'flex-end',
  },
  saveCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveCircleDisabled: {
    backgroundColor: colors.textLight,
  },
  saveLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  saveLabelDisabled: {
    color: colors.textLight,
  },
  placeholder: {
    width: 44,
  },
});
